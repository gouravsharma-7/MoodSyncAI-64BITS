import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupDebugRoutes } from "./debug-routes";
import passport, { requireAuth, getCurrentUser, hashPassword, validatePassword, validateEmail } from "./auth";
import { 
  insertMoodEntrySchema,
  insertJournalEntrySchema,
  insertChatMessageSchema,
  insertUserPreferencesSchema,
  insertUserSchema 
} from "@shared/schema";
import { analyzeSentiment, analyzeTone, generateChatResponse, generateMoodInsights } from "./services/gemini";
import { generateActivitySuggestions, generateContentRecommendations, enhanceChatResponse } from "./services/openai";
import { generateActivitySuggestionsOR, generateContentRecommendationsOR, enhanceChatResponseOR, generateJournalPrompts } from "./services/openrouter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup debug routes for table creation and troubleshooting
  setupDebugRoutes(app);
  
  // Add current user middleware to all routes
  app.use(getCurrentUser);
  
  // ===== AUTHENTICATION ROUTES =====
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Validate input
      if (!username || !email || !password || !name) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email) || await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists with this email or username" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
      });
      
      // Create default preferences
      await storage.createUserPreferences({
        userId: newUser.id,
        hobbies: [],
        preferredTone: "empathetic",
      });
      
      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ user: userWithoutPassword, message: "Registration successful" });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: "Login successful" });
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session cleanup failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    });
  });
  
  app.get("/api/auth/me", (req, res) => {
    if (req.user) {
      const { password: _, ...userWithoutPassword } = req.user as any;
      res.json({ user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // ===== MOOD TRACKING ENDPOINTS =====
  app.post("/api/mood", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId,
      });
      
      const moodEntry = await storage.createMoodEntry(validatedData);
      res.json(moodEntry);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid mood entry" });
    }
  });

  app.get("/api/mood", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { range, limit } = req.query;
      let moodEntries;

      if (range === 'week') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        moodEntries = await storage.getMoodEntriesInRange(userId, startDate, endDate);
      } else {
        moodEntries = await storage.getMoodEntries(userId, limit ? parseInt(limit as string) : undefined);
      }

      res.json(moodEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  // ===== JOURNAL ENDPOINTS =====
  app.post("/api/journal", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { content, title } = req.body;
      
      // Analyze sentiment using Gemini
      const sentiment = await analyzeSentiment(content);
      
      const validatedData = insertJournalEntrySchema.parse({
        userId,
        title,
        content,
        sentiment,
      });
      
      const journalEntry = await storage.createJournalEntry(validatedData);
      res.json(journalEntry);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create journal entry" });
    }
  });

  app.get("/api/journal", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { limit } = req.query;
      const journalEntries = await storage.getJournalEntries(
        userId, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(journalEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });
  
  app.get("/api/journal/prompts", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { mood } = req.query;
      const currentMood = mood ? parseInt(mood as string) : 3;
      
      // Get recent journal entries for context
      const recentEntries = await storage.getJournalEntries(userId, 3);
      const entryExcerpts = recentEntries.map(entry => entry.content.substring(0, 100));
      
      const prompts = await generateJournalPrompts(currentMood, entryExcerpts);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate journal prompts" });
    }
  });

  // ===== CHAT ENDPOINTS =====
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { content } = req.body;
      
      // Analyze user's tone
      const toneAnalysis = await analyzeTone(content);
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId,
        content,
        role: "user",
        tone: {
          detected: toneAnalysis.tone,
          confidence: toneAnalysis.confidence,
        },
      });

      // Get conversation history
      const recentMessages = await storage.getChatMessages(userId, 10);
      const conversationHistory = recentMessages
        .reverse()
        .slice(-5)
        .map(msg => ({ role: msg.role, content: msg.content }));

      // Generate AI response using Gemini
      const geminiResponse = await generateChatResponse(
        content,
        toneAnalysis.tone,
        conversationHistory
      );

      // Enhance response using OpenRouter (fallback to original if fails)
      let enhancedResponse;
      try {
        const enhancement = await enhanceChatResponseOR(
          geminiResponse,
          toneAnalysis.tone,
          conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
        );
        enhancedResponse = enhancement.content;
      } catch (error) {
        console.error('OpenRouter enhancement failed, using Gemini response:', error);
        enhancedResponse = geminiResponse;
      }

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId,
        content: enhancedResponse,
        role: "assistant",
        tone: {
          detected: "empathetic",
          confidence: 0.9,
        },
      });

      res.json({
        userMessage,
        aiMessage,
        detectedTone: toneAnalysis,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process chat message" });
    }
  });

  app.get("/api/chat", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { limit } = req.query;
      const messages = await storage.getChatMessages(
        userId,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // ===== INSIGHTS ENDPOINT =====
  app.get("/api/insights", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const moodEntries = await storage.getMoodEntries(userId, 14); // Last 2 weeks
      const journalEntries = await storage.getJournalEntries(userId, 5); // Last 5 entries
      
      const moodData = moodEntries.map(entry => ({
        mood: entry.mood,
        timestamp: entry.timestamp,
        notes: entry.notes || undefined
      }));
      const insights = await generateMoodInsights(moodData, journalEntries);
      res.json({ insights });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // ===== ACTIVITY SUGGESTIONS ENDPOINT =====
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { mood } = req.query;
      const currentMood = mood ? parseInt(mood as string) : 3;
      
      // Get user preferences for hobbies
      const userPrefs = await storage.getUserPreferences(userId);
      const userHobbies = userPrefs?.hobbies || ["reading", "music", "art", "exercise", "cooking"];
      
      const moodHistory = await storage.getMoodEntries(userId, 7);
      
      // Try OpenRouter first, fallback to OpenAI
      let activities;
      try {
        activities = await generateActivitySuggestionsOR(
          userHobbies,
          currentMood,
          moodHistory
        );
      } catch (error) {
        console.error('OpenRouter failed, trying OpenAI:', error);
        activities = await generateActivitySuggestions(
          userHobbies,
          currentMood,
          moodHistory
        );
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate activity suggestions" });
    }
  });

  // ===== CONTENT RECOMMENDATIONS ENDPOINT =====
  app.get("/api/recommendations", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { mood } = req.query;
      const currentMood = mood ? parseInt(mood as string) : 3;
      
      // Get user preferences
      const userPrefs = await storage.getUserPreferences(userId);
      const userPreferences = userPrefs?.hobbies || ["mindfulness", "creativity", "wellness", "meditation"];
      
      // Get recent chat topics for context
      const recentMessages = await storage.getChatMessages(userId, 5);
      const recentTopics = recentMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content.substring(0, 50))
        .slice(0, 3);
      
      // Try OpenRouter first, fallback to OpenAI
      let recommendations;
      try {
        recommendations = await generateContentRecommendationsOR(
          currentMood,
          userPreferences,
          recentTopics
        );
      } catch (error) {
        console.error('OpenRouter failed, trying OpenAI:', error);
        recommendations = await generateContentRecommendations(
          currentMood,
          userPreferences,
          recentTopics
        );
      }
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate content recommendations" });
    }
  });

  // ===== USER PREFERENCES ENDPOINTS =====
  app.get("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = await storage.createUserPreferences({
          userId,
          hobbies: ["reading", "music", "art"],
          preferredTone: "empathetic",
        });
        res.json(defaultPreferences);
      } else {
        res.json(preferences);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const updates = req.body;
      const preferences = await storage.updateUserPreferences(userId, updates);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

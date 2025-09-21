import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupDebugRoutes } from "./debug-routes";
import { 
  insertMoodEntrySchema,
  insertJournalEntrySchema,
  insertChatMessageSchema,
  insertUserPreferencesSchema 
} from "@shared/schema";
import { analyzeSentiment, analyzeTone, generateChatResponse, generateMoodInsights } from "./services/gemini";
import { generateActivitySuggestions, generateContentRecommendations, enhanceChatResponse } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup debug routes for table creation and troubleshooting
  setupDebugRoutes(app);
  
  // Mock user ID for demo (in production, this would come from authentication)
  const MOCK_USER_ID = "user_1";

  // Mood tracking endpoints
  app.post("/api/mood", async (req, res) => {
    try {
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: MOCK_USER_ID,
      });
      
      const moodEntry = await storage.createMoodEntry(validatedData);
      res.json(moodEntry);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid mood entry" });
    }
  });

  app.get("/api/mood", async (req, res) => {
    try {
      const { range, limit } = req.query;
      let moodEntries;

      if (range === 'week') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        moodEntries = await storage.getMoodEntriesInRange(MOCK_USER_ID, startDate, endDate);
      } else {
        moodEntries = await storage.getMoodEntries(MOCK_USER_ID, limit ? parseInt(limit as string) : undefined);
      }

      res.json(moodEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  // Journal endpoints
  app.post("/api/journal", async (req, res) => {
    try {
      const { content, title } = req.body;
      
      // Analyze sentiment using Gemini
      const sentiment = await analyzeSentiment(content);
      
      const validatedData = insertJournalEntrySchema.parse({
        userId: MOCK_USER_ID,
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

  app.get("/api/journal", async (req, res) => {
    try {
      const { limit } = req.query;
      const journalEntries = await storage.getJournalEntries(
        MOCK_USER_ID, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(journalEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  // Chat endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { content } = req.body;
      
      // Analyze user's tone
      const toneAnalysis = await analyzeTone(content);
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: MOCK_USER_ID,
        content,
        role: "user",
        tone: {
          detected: toneAnalysis.tone,
          confidence: toneAnalysis.confidence,
        },
      });

      // Get conversation history
      const recentMessages = await storage.getChatMessages(MOCK_USER_ID, 10);
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

      // Enhance response using OpenAI
      const enhancedResponse = await enhanceChatResponse(
        geminiResponse,
        toneAnalysis.tone,
        conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      );

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId: MOCK_USER_ID,
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

  app.get("/api/chat", async (req, res) => {
    try {
      const { limit } = req.query;
      const messages = await storage.getChatMessages(
        MOCK_USER_ID,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Insights endpoint
  app.get("/api/insights", async (req, res) => {
    try {
      const moodEntries = await storage.getMoodEntries(MOCK_USER_ID, 14); // Last 2 weeks
      const journalEntries = await storage.getJournalEntries(MOCK_USER_ID, 5); // Last 5 entries
      
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

  // Activity suggestions endpoint
  app.get("/api/activities", async (req, res) => {
    try {
      const { mood } = req.query;
      const currentMood = mood ? parseInt(mood as string) : 3;
      
      // Get user preferences (mock for now)
      const userHobbies = ["drawing", "writing", "cooking", "gardening", "photography"];
      
      const moodHistory = await storage.getMoodEntries(MOCK_USER_ID, 7);
      
      const activities = await generateActivitySuggestions(
        userHobbies,
        currentMood,
        moodHistory
      );
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate activity suggestions" });
    }
  });

  // Content recommendations endpoint
  app.get("/api/recommendations", async (req, res) => {
    try {
      const { mood } = req.query;
      const currentMood = mood ? parseInt(mood as string) : 3;
      
      // Mock user preferences and recent topics
      const userPreferences = ["mindfulness", "creativity", "wellness", "meditation"];
      const recentTopics = ["stress management", "self-care", "productivity"];
      
      const recommendations = await generateContentRecommendations(
        currentMood,
        userPreferences,
        recentTopics
      );
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate content recommendations" });
    }
  });

  // User preferences endpoints
  app.get("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(MOCK_USER_ID);
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = await storage.createUserPreferences({
          userId: MOCK_USER_ID,
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

  app.put("/api/preferences", async (req, res) => {
    try {
      const updates = req.body;
      const preferences = await storage.updateUserPreferences(MOCK_USER_ID, updates);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

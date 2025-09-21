import { GoogleGenAI } from "@google/genai";

// the newest Gemini model is "gemini-2.5-flash" or "gemini-2.5-pro" - do not change this unless explicitly requested by the user
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Sentiment {
  rating: number;
  confidence: number;
  dominant_emotion: string;
}

export interface ToneAnalysis {
  tone: string;
  confidence: number;
  emotional_state: string;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  try {
    const systemPrompt = `You are a sentiment analysis expert specializing in mental health applications. 
Analyze the sentiment of the text and provide:
1. A rating from 1 to 5 (1=very negative, 2=negative, 3=neutral, 4=positive, 5=very positive)
2. A confidence score between 0 and 1
3. The dominant emotion (e.g., joy, sadness, anxiety, anger, fear, surprise, neutral)

Respond with JSON in this exact format: 
{'rating': number, 'confidence': number, 'dominant_emotion': string}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
            dominant_emotion: { type: "string" },
          },
          required: ["rating", "confidence", "dominant_emotion"],
        },
      },
      contents: text,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: Sentiment = JSON.parse(rawJson);
      return {
        rating: Math.max(1, Math.min(5, Math.round(data.rating))),
        confidence: Math.max(0, Math.min(1, data.confidence)),
        dominant_emotion: data.dominant_emotion,
      };
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to analyze sentiment: ${error}`);
  }
}

export async function analyzeTone(text: string): Promise<ToneAnalysis> {
  try {
    const systemPrompt = `You are a tone analysis expert for mental health conversations.
Analyze the tone and emotional state of the text and provide:
1. The primary tone (e.g., anxious, calm, excited, sad, angry, hopeful, frustrated, content)
2. A confidence score between 0 and 1
3. The overall emotional state (e.g., distressed, peaceful, energetic, melancholic, irritated, optimistic)

Respond with JSON in this exact format:
{'tone': string, 'confidence': number, 'emotional_state': string}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            tone: { type: "string" },
            confidence: { type: "number" },
            emotional_state: { type: "string" },
          },
          required: ["tone", "confidence", "emotional_state"],
        },
      },
      contents: text,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: ToneAnalysis = JSON.parse(rawJson);
      return {
        tone: data.tone,
        confidence: Math.max(0, Math.min(1, data.confidence)),
        emotional_state: data.emotional_state,
      };
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to analyze tone: ${error}`);
  }
}

export async function generateChatResponse(
  message: string,
  userTone: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const systemPrompt = `You are MoodWise, an empathetic AI companion specialized in mental health and wellness support.
The user's current tone is: ${userTone}

Guidelines:
- Adapt your response tone to match the user's emotional state appropriately
- Be supportive, understanding, and non-judgmental
- Provide helpful suggestions when appropriate but don't be prescriptive
- If the user seems distressed, prioritize emotional support over problem-solving
- Keep responses conversational and warm
- If you detect serious mental health concerns, gently suggest professional help

Conversation context:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current message: ${message}

Respond naturally and empathetically:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: message,
    });

    return response.text || "I'm here to listen and support you. Could you tell me more about how you're feeling?";
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error}`);
  }
}

export async function generateMoodInsights(
  moodData: Array<{ mood: number; timestamp: Date; notes?: string }>,
  journalEntries: Array<{ content: string; sentiment: any; createdAt: Date }>
): Promise<string[]> {
  try {
    const systemPrompt = `You are an AI wellness coach analyzing mood patterns and journal entries.
Generate 2-3 personalized insights based on the user's mood and journal data.

Each insight should be:
- Supportive and encouraging
- Based on actual patterns in the data
- Actionable when appropriate
- 1-2 sentences long

Format as a JSON array of strings.`;

    const dataContext = `
Mood Data (1-5 scale): ${moodData.map(entry => `${entry.mood} on ${entry.timestamp.toDateString()}${entry.notes ? ` (${entry.notes})` : ''}`).join(', ')}

Recent Journal Entries: ${journalEntries.slice(0, 3).map(entry => `${entry.createdAt.toDateString()}: ${entry.content.substring(0, 200)}...`).join('\n')}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: dataContext,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      return ["Your mood tracking shows great self-awareness. Keep up the good work!"];
    }
  } catch (error) {
    console.error('Failed to generate mood insights:', error);
    return ["Your mood tracking shows great self-awareness. Keep up the good work!"];
  }
}

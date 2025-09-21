import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ActivitySuggestion {
  title: string;
  description: string;
  hobby: string;
  duration: string;
  difficulty: string;
  mood_target: string;
}

export interface ContentRecommendation {
  title: string;
  description: string;
  type: 'article' | 'meditation' | 'podcast' | 'music' | 'video';
  url?: string;
  mood_match: string;
  benefits: string[];
}

export async function generateActivitySuggestions(
  userHobbies: string[],
  currentMood: number,
  moodHistory: Array<{ mood: number; timestamp: Date }>
): Promise<ActivitySuggestion[]> {
  try {
    const moodDescription = getMoodDescription(currentMood);
    const prompt = `Based on the user's hobbies (${userHobbies.join(', ')}) and current mood (${moodDescription}), generate 3 personalized therapeutic activity suggestions.

User's mood history shows: ${moodHistory.slice(0, 5).map(entry => `${getMoodDescription(entry.mood)} on ${entry.timestamp.toDateString()}`).join(', ')}

Each activity should:
- Be based on one of their hobbies
- Be therapeutic and mood-enhancing
- Include specific, actionable instructions
- Be achievable in 15-45 minutes
- Match their current emotional state

Respond with JSON array of activities with this structure:
[{
  "title": "Activity name",
  "description": "Detailed instructions for the activity",
  "hobby": "Which hobby this relates to",
  "duration": "Estimated time needed",
  "difficulty": "Easy/Medium/Hard",
  "mood_target": "What mood benefit this provides"
}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a therapeutic activity specialist who creates personalized wellness activities based on hobbies and mood states."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"activities": []}');
    return result.activities || result || [];
  } catch (error) {
    throw new Error(`Failed to generate activity suggestions: ${error}`);
  }
}

export async function generateContentRecommendations(
  currentMood: number,
  userPreferences: string[],
  recentTopics: string[]
): Promise<ContentRecommendation[]> {
  try {
    const moodDescription = getMoodDescription(currentMood);
    const prompt = `Generate 4 personalized content recommendations for someone feeling ${moodDescription}.

User preferences: ${userPreferences.join(', ')}
Recent interests: ${recentTopics.join(', ')}

Include a variety of content types: articles, meditations, podcasts, and music.
Each recommendation should be therapeutic and mood-appropriate.

Respond with JSON array:
[{
  "title": "Content title",
  "description": "Brief description",
  "type": "article|meditation|podcast|music|video",
  "url": "Optional URL if applicable",
  "mood_match": "Why this fits their current mood",
  "benefits": ["benefit1", "benefit2"]
}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a therapeutic content curator specializing in mental wellness recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    return result.recommendations || result || [];
  } catch (error) {
    throw new Error(`Failed to generate content recommendations: ${error}`);
  }
}

export async function enhanceChatResponse(
  geminiResponse: string,
  userTone: string,
  conversationContext: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are helping to enhance an AI therapy response. The user's tone is: ${userTone}
          
          Take the base response and improve it by:
          - Making it more empathetic and personally relevant
          - Adjusting the tone to better match the user's emotional state
          - Adding gentle therapeutic techniques when appropriate
          - Keeping it conversational and supportive
          
          Context: ${conversationContext}`
        },
        {
          role: "user",
          content: `Enhance this response: "${geminiResponse}"`
        }
      ],
    });

    return response.choices[0].message.content || geminiResponse;
  } catch (error) {
    console.error('Failed to enhance chat response:', error);
    return geminiResponse; // Fallback to original response
  }
}

function getMoodDescription(mood: number): string {
  const descriptions = {
    1: "very sad/distressed",
    2: "sad/down",
    3: "neutral/okay",
    4: "good/positive",
    5: "great/very happy"
  };
  return descriptions[mood as keyof typeof descriptions] || "neutral";
}

import OpenAI from "openai";

// OpenRouter API configuration - compatible with OpenAI SDK
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://moodsyncai.app", // Your app's URL
    "X-Title": "MoodSyncAI", // Your app's name
  },
});

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

export interface TherapeuticResponse {
  content: string;
  techniques: string[];
  followUp: string;
}

export async function generateActivitySuggestionsOR(
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
{
  "activities": [{
    "title": "Activity name",
    "description": "Detailed instructions for the activity",
    "hobby": "Which hobby this relates to",
    "duration": "Estimated time needed",
    "difficulty": "Easy/Medium/Hard",
    "mood_target": "What mood benefit this provides"
  }]
}`;

    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // High-quality model for therapeutic content
      messages: [
        {
          role: "system",
          content: "You are a therapeutic activity specialist who creates personalized wellness activities based on hobbies and mood states. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"activities": []}');
    return result.activities || [];
  } catch (error) {
    console.error('OpenRouter activity suggestions error:', error);
    throw new Error(`Failed to generate activity suggestions: ${error}`);
  }
}

export async function generateContentRecommendationsOR(
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

Respond with JSON:
{
  "recommendations": [{
    "title": "Content title",
    "description": "Brief description",
    "type": "article|meditation|podcast|music|video",
    "url": "Optional URL if applicable",
    "mood_match": "Why this fits their current mood",
    "benefits": ["benefit1", "benefit2"]
  }]
}`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-pro-1.5", // Good for content curation
      messages: [
        {
          role: "system",
          content: "You are a therapeutic content curator specializing in mental wellness recommendations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    return result.recommendations || [];
  } catch (error) {
    console.error('OpenRouter content recommendations error:', error);
    throw new Error(`Failed to generate content recommendations: ${error}`);
  }
}

export async function enhanceChatResponseOR(
  geminiResponse: string,
  userTone: string,
  conversationContext: string
): Promise<TherapeuticResponse> {
  try {
    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // Best for therapeutic enhancement
      messages: [
        {
          role: "system",
          content: `You are a mental health AI assistant specializing in therapeutic communication. The user's tone is: ${userTone}
          
          Take the base response and enhance it by:
          - Making it more empathetic and personally relevant
          - Adjusting the tone to better match the user's emotional state
          - Adding gentle therapeutic techniques when appropriate
          - Keeping it conversational and supportive
          - Including 1-2 therapeutic techniques used
          - Suggesting a thoughtful follow-up question or prompt
          
          Context: ${conversationContext}
          
          Respond with JSON:
          {
            "content": "Enhanced response text",
            "techniques": ["technique1", "technique2"],
            "followUp": "Thoughtful follow-up question"
          }`
        },
        {
          role: "user",
          content: `Enhance this response: "${geminiResponse}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"content": "", "techniques": [], "followUp": ""}');
    return {
      content: result.content || geminiResponse,
      techniques: result.techniques || [],
      followUp: result.followUp || "How are you feeling about this?"
    };
  } catch (error) {
    console.error('OpenRouter chat enhancement error:', error);
    return {
      content: geminiResponse,
      techniques: [],
      followUp: "How are you feeling about this?"
    };
  }
}

export async function generateJournalPrompts(
  moodLevel: number,
  recentEntries: string[]
): Promise<{ prompts: string[]; theme: string }> {
  try {
    const moodDescription = getMoodDescription(moodLevel);
    const prompt = `Based on the user's current mood (${moodDescription}) and their recent journal themes, generate 3 thoughtful journal prompts that would be therapeutically beneficial.

Recent journal excerpts: ${recentEntries.slice(0, 3).join('; ')}

Generate prompts that:
- Are appropriate for their current emotional state
- Encourage healthy reflection and processing
- Build on themes from recent entries
- Promote self-compassion and growth

Respond with JSON:
{
  "prompts": ["prompt1", "prompt2", "prompt3"],
  "theme": "Overall therapeutic theme (e.g., 'self-compassion', 'gratitude', 'processing emotions')"
}`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-pro-1.5",
      messages: [
        {
          role: "system",
          content: "You are a therapeutic journaling specialist who creates prompts for emotional wellness and self-reflection."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"prompts": [], "theme": ""}');
    return {
      prompts: result.prompts || ["What am I grateful for today?", "How can I show myself compassion?", "What emotions am I experiencing right now?"],
      theme: result.theme || "self-reflection"
    };
  } catch (error) {
    console.error('OpenRouter journal prompts error:', error);
    return {
      prompts: ["What am I grateful for today?", "How can I show myself compassion?", "What emotions am I experiencing right now?"],
      theme: "self-reflection"
    };
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

export default openrouter;
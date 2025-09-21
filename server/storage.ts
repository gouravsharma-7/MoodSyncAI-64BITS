import {
  users,
  moodEntries,
  journalEntries,
  chatMessages,
  userPreferences,
  contentRecommendations,
  type User,
  type InsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type JournalEntry,
  type InsertJournalEntry,
  type ChatMessage,
  type InsertChatMessage,
  type UserPreferences,
  type InsertUserPreferences,
  type ContentRecommendation,
  type InsertContentRecommendation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mood tracking
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]>;
  getMoodEntriesInRange(userId: string, startDate: Date, endDate: Date): Promise<MoodEntry[]>;

  // Journal
  createJournalEntry(journalEntry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry>;

  // Chat
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;

  // User preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;

  // Content recommendations
  createContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation>;
  getContentRecommendations(userId: string, mood?: number, limit?: number): Promise<ContentRecommendation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db.insert(moodEntries).values(moodEntry).returning();
    return entry;
  }

  async getMoodEntries(userId: string, limit: number = 50): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.timestamp))
      .limit(limit);
  }

  async getMoodEntriesInRange(userId: string, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.timestamp, startDate),
          lte(moodEntries.timestamp, endDate)
        )
      )
      .orderBy(desc(moodEntries.timestamp));
  }

  async createJournalEntry(journalEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(journalEntry).returning();
    return entry;
  }

  async getJournalEntries(userId: string, limit: number = 20): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const [entry] = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
    return entry;
  }

  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(chatMessage).returning();
    return message;
  }

  async getChatMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [userPref] = await db.insert(userPreferences).values(preferences).returning();
    return userPref;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const [preferences] = await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return preferences;
  }

  async createContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation> {
    const [rec] = await db.insert(contentRecommendations).values(recommendation).returning();
    return rec;
  }

  async getContentRecommendations(userId: string, mood?: number, limit: number = 20): Promise<ContentRecommendation[]> {
    let query = db
      .select()
      .from(contentRecommendations)
      .where(eq(contentRecommendations.userId, userId));

    if (mood !== undefined) {
      return await db
        .select()
        .from(contentRecommendations)
        .where(and(eq(contentRecommendations.userId, userId), eq(contentRecommendations.mood, mood)))
        .orderBy(desc(contentRecommendations.createdAt))
        .limit(limit);
    }

    return await query.orderBy(desc(contentRecommendations.createdAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();

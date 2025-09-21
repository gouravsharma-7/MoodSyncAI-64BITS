import { db } from "./db";
import { sql } from "drizzle-orm";

export async function bootstrapDatabase() {
  try {
    // Give a small delay to ensure environment variables are loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("🔄 Initializing database connection...");
    
    // Test the connection first
    await db().execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");
    // Create users table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create mood_entries table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mood INTEGER NOT NULL,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create journal_entries table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT NOT NULL,
        sentiment JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create chat_messages table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        tone JSONB,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create user_preferences table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hobbies JSONB DEFAULT '[]',
        preferred_tone TEXT DEFAULT 'empathetic',
        notification_settings JSONB DEFAULT '{"dailyReminders": true, "moodTracking": true, "journaling": true}'
      );
    `);

    // Create content_recommendations table
    await db().execute(sql`
      CREATE TABLE IF NOT EXISTS content_recommendations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT,
        mood INTEGER,
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating database tables:", error);
    throw error;
  }
}
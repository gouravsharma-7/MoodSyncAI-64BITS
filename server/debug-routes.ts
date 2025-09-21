import type { Express } from "express";
import { bootstrapDatabase } from "./bootstrap";

export function setupDebugRoutes(app: Express) {
  // Only enable debug routes in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  // Debug endpoint to manually create tables
  app.post("/api/debug/create-tables", async (req, res) => {
    try {
      console.log("🔧 Manual table creation triggered...");
      console.log("Environment check:", {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      });
      
      await bootstrapDatabase();
      res.json({ success: true, message: "Tables created successfully" });
    } catch (error) {
      console.error("Table creation failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Debug endpoint to check environment (dev only)
  app.get("/api/debug/env", (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: "Not found" });
    }
    
    res.json({
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_DB_URL: !!process.env.SUPABASE_DB_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    });
  });

  // Debug endpoint to create mock user
  app.post("/api/debug/create-user", async (req, res) => {
    try {
      console.log("🔧 Creating mock user...");
      const { storage } = await import("./storage");
      
      const mockUser = await storage.createUser({
        username: "demo_user",
        email: "demo@example.com", 
        password: "demo123",
        name: "Demo User"
      });
      
      res.json({ success: true, user: mockUser });
    } catch (error) {
      console.error("User creation failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Debug endpoint to test database query
  app.get("/api/debug/test-db", async (req, res) => {
    try {
      console.log("🔧 Testing database query...");
      const { storage } = await import("./storage");
      
      const users = await storage.getUser("user_1");
      const moodEntries = await storage.getMoodEntries("user_1", 5);
      
      res.json({ 
        success: true, 
        userExists: !!users,
        moodEntriesCount: moodEntries.length 
      });
    } catch (error) {
      console.error("Database test failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });
}
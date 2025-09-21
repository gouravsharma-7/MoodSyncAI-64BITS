import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.SUPABASE_DB_URL) {
      throw new Error(
        "SUPABASE_DB_URL must be set. Please provide your Supabase database URL.",
      );
    }
    
    pool = new Pool({ 
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('Database pool closed.');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (pool) {
    await pool.end();
    console.log('Database pool closed.');
  }
  process.exit(0);
});

export { getDb as db };
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Using connection string:', process.env.SUPABASE_DB_URL?.replace(/:[^:]+@/, ':****@'));
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time from database:', result.rows[0].now);
    client.release();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 This is usually a password authentication error.');
      console.log('Please check:');
      console.log('1. Your password is correct: rootGourav-77');
      console.log('2. Your Supabase project is active');
      console.log('3. Try getting the connection string from Supabase dashboard');
    }
    
    process.exit(1);
  }
}

testConnection();
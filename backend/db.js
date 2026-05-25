// db.js
require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');
console.log("DATABASE_URL:", process.env.DATABASE_URL);
// 🔧 Fix Render-Supabase issue: Force IPv4
dns.setDefaultResultOrder('ipv4first');

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Create tables (run once when app starts)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        username TEXT UNIQUE
      );
    `);
    // Add username column if missing
    try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`); } catch (e) {}
    // Allow NULL email for username-only login
    try { await pool.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        timer_minutes INTEGER NOT NULL DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure modules table has all required columns (for existing tables)
    const columnsToAdd = [
      { col: 'timer_minutes', def: 'INTEGER NOT NULL DEFAULT 30' },
      { col: 'created_at', def: 'TIMESTAMP DEFAULT NOW()' }
    ];
    for (const { col, def } of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS ${col} ${def}`);
      } catch (e) {
        // ignore
      }
    }

    // Add module_id column if it doesn't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE questions ADD COLUMN module_id INTEGER REFERENCES modules(id)`);
    } catch (e) {
      // Column already exists, ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct INTEGER NOT NULL,
        category TEXT NOT NULL,
        module_id INTEGER REFERENCES modules(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        answers JSONB,
        score INTEGER,
        total_questions INTEGER,
        percentage INTEGER,
        passed BOOLEAN,
        time_taken INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Connected to PostgreSQL and ensured tables exist');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
})();

module.exports = pool;

const { Pool } = require('pg');

// =============================================
// PostgreSQL Pool Configuration for Supabase
// =============================================
// This connects to Supabase via the connection pooler for better performance
// Supports direct SQL queries while maintaining compatibility with existing code

// Validate DATABASE_URL on startup
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL environment variable is not set!');
  console.error('   For Supabase, use the "Connection Pooler" URL ending in :6543');
  console.error('   Format: postgresql://[user]:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool settings optimized for production
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection not established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
  // Don't exit - let the app try to recover
});

// Test connection on startup
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully (Supabase PostgreSQL)');
  }
});

module.exports = pool;

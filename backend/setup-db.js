#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await client.query(statement);
          console.log('✅ Executed:', statement.substring(0, 60) + '...');
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log('ℹ️  Already exists:', statement.substring(0, 60) + '...');
          } else {
            console.error('❌ Error:', err.message);
          }
        }
      }
      console.log('\nDatabase schema setup complete!');
    } else {
      console.log('No schema.sql found, skipping schema setup.');
    }

    await client.end();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

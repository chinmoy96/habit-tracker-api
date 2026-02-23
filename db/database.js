const { Pool } = require('pg');
const initializeSchema = require('./schema');

// Create connection pool using Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema
const initializeDatabase = async () => {
  try {
    await initializeSchema(pool);
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase,
};

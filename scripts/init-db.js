const { ensureSchema, closePool } = require('../config/database');

async function initializeDatabase() {
  try {
    await ensureSchema();
    console.log('Database schema is ready.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

initializeDatabase();

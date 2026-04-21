const app = require('./config/app');
const env = require('./config/env');
const { ensureSchema, closePool } = require('./config/database');

async function startServer() {
  try {
    await ensureSchema();

    const server = app.listen(env.port, () => {
      console.log(`Malawi Tourism Blog is running on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

startServer();

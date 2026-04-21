const app = require('./config/app');
const env = require('./config/env');
const { connectPrisma, disconnectPrisma } = require('./config/prisma');

async function startServer() {
  try {
    await connectPrisma();

    const server = app.listen(env.port, () => {
      console.log(`Malawi Hidden Gems is running on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectPrisma();
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

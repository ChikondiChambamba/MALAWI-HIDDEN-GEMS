const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const env = require('./env');

const globalForPrisma = globalThis;
const adapter = globalForPrisma.prismaAdapter || new PrismaMariaDb({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: 10,
  allowPublicKeyRetrieval: true,
});

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}

async function connectPrisma() {
  await prisma.$connect();
}

async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  connectPrisma,
  disconnectPrisma,
};

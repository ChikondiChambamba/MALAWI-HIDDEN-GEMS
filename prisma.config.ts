import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = encodeURIComponent(process.env.DB_USER || '');
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || '3306';
  const database = process.env.DB_NAME || '';

  if (!user || !database) {
    return env('DATABASE_URL');
  }

  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
});

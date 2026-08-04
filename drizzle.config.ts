import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/api/src/database/schema.ts',
  out: './database/migrations-pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://netlogger:NetLoggerPg2026Local@localhost:5432/netlogger',
  },
});

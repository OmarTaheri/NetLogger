import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
  databasePath: process.env.DATABASE_PATH || './data/tracker.db',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '0', 10),
  webhookTimeout: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10),
};

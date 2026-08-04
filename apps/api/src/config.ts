import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@netlogger.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123456!',
  defaultUserEmail: process.env.DEFAULT_USER_EMAIL || 'user@netlogger.local',
  defaultUserPassword: process.env.DEFAULT_USER_PASSWORD || 'User12345678!',
  defaultUserDisplayName: process.env.DEFAULT_USER_DISPLAY_NAME || 'Demo User',
  showDemoAccounts: process.env.SHOW_DEMO_ACCOUNTS === 'true'
    || (process.env.NODE_ENV !== 'production' && process.env.SHOW_DEMO_ACCOUNTS !== 'false'),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://netlogger:NetLoggerPg2026Local@localhost:5432/netlogger',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '0', 10),
  webhookTimeout: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};

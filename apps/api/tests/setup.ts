import { Pool } from 'pg';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://netlogger:NetLoggerPg2026Local@localhost:5432/netlogger_test';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass123!';
process.env.SESSION_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3000';
process.env.DATA_RETENTION_DAYS = '0';
process.env.LOG_LEVEL = 'silent';
process.env.GOOGLE_CLIENT_ID = 'test-google-client.apps.googleusercontent.com';
process.env.SHOW_DEMO_ACCOUNTS = 'false';

const resetPool = new Pool({ connectionString: process.env.DATABASE_URL });
await resetPool.query('DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
await resetPool.end();

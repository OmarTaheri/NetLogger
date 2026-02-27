import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './data/test-tracker.db';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass123';
process.env.SESSION_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3000';
process.env.DATA_RETENTION_DAYS = '0';
process.env.LOG_LEVEL = 'silent';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Clean up test database before tests
const dbPath = path.resolve(process.cwd(), 'data/test-tracker.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
// Also clean WAL/SHM files
for (const ext of ['-wal', '-shm']) {
  const f = dbPath + ext;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

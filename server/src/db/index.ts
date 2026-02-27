import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.js';
import * as schema from './schema.js';
import fs from 'fs';
import path from 'path';

const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite: DatabaseType = new Database(config.databasePath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function initDb() {
  // Handle legacy databases that have tables but no Drizzle migration history
  const hasOldTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'").get();
  const hasMigrationHistory = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'").get();

  if (hasOldTables && !hasMigrationHistory) {
    console.log('Legacy database detected, dropping old tables for clean migration...');
    sqlite.pragma('foreign_keys = OFF');
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all() as { name: string }[];
    for (const { name } of tables) {
      sqlite.exec(`DROP TABLE IF EXISTS "${name}"`);
    }
    sqlite.pragma('foreign_keys = ON');
  }

  // cwd is project root in Docker (/app) but server/ dir in dev (npm -w server)
  const projectRoot = process.cwd().endsWith('server') ? path.resolve(process.cwd(), '..') : process.cwd();
  migrate(db, { migrationsFolder: path.join(projectRoot, 'drizzle') });
}

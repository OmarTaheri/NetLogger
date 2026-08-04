import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import * as schema from './schema.js';

export const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool, { schema });

export async function initDb() {
  const migrationsFolder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../database/migrations-pg',
  );
  await migrate(db, { migrationsFolder });
}

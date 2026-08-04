import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../database/index.js';
import { users } from '../database/schema.js';
import { logger } from '../utils/logger.js';

export async function ensureDefaultAccounts() {
  let admin = (await db.select().from(users).where(eq(users.email, config.adminEmail.trim().toLowerCase())).limit(1))[0]
    ?? (await db.select().from(users).where(eq(users.username, config.adminUsername)).limit(1))[0];
  if (!admin) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);
    admin = (await db.insert(users).values({
      username: config.adminUsername,
      email: config.adminEmail.trim().toLowerCase(),
      displayName: 'Administrator',
      passwordHash,
      role: 'admin',
    }).returning())[0];
    logger.info(`Administrator "${config.adminEmail}" created`);
  } else if (!admin.email || admin.role !== 'admin') {
    admin = (await db.update(users).set({
      email: admin.email || config.adminEmail.trim().toLowerCase(),
      role: 'admin',
    }).where(eq(users.id, admin.id)).returning())[0];
  }

  const defaultUserEmail = config.defaultUserEmail.trim().toLowerCase();
  if (defaultUserEmail && !(await db.select().from(users).where(eq(users.email, defaultUserEmail)).limit(1))[0]) {
    const passwordHash = await bcrypt.hash(config.defaultUserPassword, 10);
    await db.insert(users).values({
      email: defaultUserEmail,
      displayName: config.defaultUserDisplayName,
      passwordHash,
      role: 'user',
    });
    logger.info(`Default user "${defaultUserEmail}" created`);
  }

  return admin;
}

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { admins } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';

export function getAdminByUsername(username: string) {
  return db.select().from(admins).where(eq(admins.username, username)).get();
}

export function getAdminById(id: number) {
  return db.select({ id: admins.id, username: admins.username })
    .from(admins)
    .where(eq(admins.id, id))
    .get();
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(admin: { id: number; username: string }): string {
  return jwt.sign({ id: admin.id, username: admin.username }, config.sessionSecret, {
    expiresIn: '7d',
  });
}

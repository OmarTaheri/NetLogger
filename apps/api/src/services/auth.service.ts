import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '../database/index.js';
import { users } from '../database/schema.js';
import { config } from '../config.js';

const googleClient = new OAuth2Client();
export const SESSION_COOKIE = 'netlogger_session';

export type PublicUser = {
  id: number;
  username: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  onboardingCompleted: boolean;
  providers: Array<'password' | 'google'>;
};

type UserRow = typeof users.$inferSelect;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toPublicUser(user: UserRow): PublicUser {
  const providers: PublicUser['providers'] = [];
  if (user.passwordHash) providers.push('password');
  if (user.googleSubject) providers.push('google');
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
    providers,
  };
}

export async function getUserByIdentifier(identifier: string) {
  const normalized = normalizeEmail(identifier);
  return (await db.select().from(users).where(or(
    eq(users.email, normalized),
    eq(users.username, identifier.trim()),
  )).limit(1))[0];
}

export async function getUserById(id: number) {
  return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function getUserByEmail(email: string) {
  return (await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1))[0];
}

export async function getUserByGoogleSubject(subject: string) {
  return (await db.select().from(users).where(eq(users.googleSubject, subject)).limit(1))[0];
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function updatePassword(id: number, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return (await db.update(users).set({
    passwordHash,
    tokenVersion: sql`${users.tokenVersion} + 1`,
    updatedAt: sql`(CURRENT_TIMESTAMP)::text`,
  }).where(eq(users.id, id)).returning())[0];
}

export async function completeOnboarding(userId: number, displayName: string, username?: string) {
  return (await db.update(users).set({
    displayName: displayName.trim(),
    username: username || undefined,
    onboardingCompleted: true,
    updatedAt: sql`(CURRENT_TIMESTAMP)::text`,
  }).where(eq(users.id, userId)).returning())[0];
}

export function createToken(user: Pick<UserRow, 'id' | 'tokenVersion'>): string {
  return jwt.sign({ sub: String(user.id), ver: user.tokenVersion }, config.sessionSecret, {
    expiresIn: '7d',
  });
}

export async function verifyToken(token: string) {
  const payload = jwt.verify(token, config.sessionSecret) as jwt.JwtPayload;
  const userId = Number(payload.sub);
  const tokenVersion = Number(payload.ver);
  if (!Number.isInteger(userId) || !Number.isInteger(tokenVersion)) return null;
  const user = await getUserById(userId);
  if (!user || user.tokenVersion !== tokenVersion) return null;
  return user;
}

export async function verifyGoogleCredential(credential: string): Promise<TokenPayload | null> {
  if (!config.googleClientId) return null;
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) return null;
  return payload;
}

export async function signInWithGoogle(payload: TokenPayload): Promise<{ user?: UserRow; linkRequired?: boolean }> {
  const bySubject = await getUserByGoogleSubject(payload.sub);
  if (bySubject) return { user: bySubject };

  const email = normalizeEmail(payload.email!);
  const byEmail = await getUserByEmail(email);
  if (byEmail) return { linkRequired: true };

  const user = (await db.insert(users).values({
    email,
    displayName: payload.name?.trim() || email.split('@')[0],
    googleSubject: payload.sub,
    avatarUrl: payload.picture || null,
    onboardingCompleted: false,
  }).returning())[0];
  return { user };
}

export async function linkGoogleAccount(userId: number, payload: TokenPayload) {
  const user = await getUserById(userId);
  if (!user || !user.passwordHash || !user.email) return null;
  if (normalizeEmail(payload.email!) !== user.email) return null;

  const existing = (await db.select().from(users).where(and(
    eq(users.googleSubject, payload.sub),
    sql`${users.id} != ${userId}`,
  )).limit(1))[0];
  if (existing) return null;

  return (await db.update(users).set({
    googleSubject: payload.sub,
    avatarUrl: user.avatarUrl || payload.picture || null,
    updatedAt: sql`(CURRENT_TIMESTAMP)::text`,
  }).where(eq(users.id, userId)).returning())[0];
}

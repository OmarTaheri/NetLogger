import { db } from '../database/index.js';
import { domains } from '../database/schema.js';
import { and, eq, sql } from 'drizzle-orm';

export async function createDomain(userId: number, domain: string) {
  return (await db.insert(domains).values({ userId, domain }).returning())[0];
}

export async function getAllDomains(userId: number) {
  return db.select().from(domains)
    .where(eq(domains.userId, userId))
    .orderBy(sql`${domains.createdAt} DESC`);
}

export async function getDomainById(id: number, userId: number) {
  return (await db.select().from(domains).where(and(eq(domains.id, id), eq(domains.userId, userId))).limit(1))[0];
}

export async function updateDomain(userId: number, id: number, data: { domain?: string; isActive?: boolean }) {
  return (await db.update(domains).set(data)
    .where(and(eq(domains.id, id), eq(domains.userId, userId))).returning())[0];
}

export async function deleteDomain(userId: number, id: number) {
  return (await db.delete(domains).where(and(eq(domains.id, id), eq(domains.userId, userId))).returning())[0];
}

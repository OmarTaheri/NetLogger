import { db } from '../db/index.js';
import { domains } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export function createDomain(domain: string) {
  return db.insert(domains).values({ domain }).returning().get();
}

export function getAllDomains() {
  return db.select().from(domains).orderBy(sql`${domains.createdAt} DESC`).all();
}

export function getDomainById(id: number) {
  return db.select().from(domains).where(eq(domains.id, id)).get();
}

export function updateDomain(id: number, data: { domain?: string; isActive?: boolean }) {
  return db.update(domains).set(data).where(eq(domains.id, id)).returning().get();
}

export function deleteDomain(id: number) {
  return db.delete(domains).where(eq(domains.id, id)).run();
}

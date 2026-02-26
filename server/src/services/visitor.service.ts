import { db } from '../db/index.js';
import { visitors, links } from '../db/schema.js';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export function createVisitor(data: Record<string, unknown>) {
  return db.insert(visitors).values(data as any).returning().get();
}

export function getVisitors(options: { linkId?: number; limit?: number; offset?: number; since?: string }) {
  const { linkId, limit = 50, offset = 0, since } = options;

  const conditions = [];
  if (linkId) conditions.push(eq(visitors.linkId, linkId));
  if (since) conditions.push(gte(visitors.createdAt, since));

  let query = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .leftJoin(links, eq(visitors.linkId, links.id))
    .orderBy(desc(visitors.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const results = query.all();
  return results.map(r => ({
    ...r.visitor,
    linkSlug: r.linkSlug,
    linkTitle: r.linkTitle,
  }));
}

export function getVisitorById(id: number) {
  const result = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .leftJoin(links, eq(visitors.linkId, links.id))
    .where(eq(visitors.id, id))
    .get();

  if (!result) return null;
  return { ...result.visitor, linkSlug: result.linkSlug, linkTitle: result.linkTitle };
}

export function deleteVisitor(id: number) {
  return db.delete(visitors).where(eq(visitors.id, id)).run();
}

export function updateVisitor(id: number, data: Record<string, unknown>) {
  return db.update(visitors).set(data as any).where(eq(visitors.id, id)).run();
}

export function getVisitorCount(linkId?: number, since?: string) {
  const conditions = [];
  if (linkId) conditions.push(eq(visitors.linkId, linkId));
  if (since) conditions.push(gte(visitors.createdAt, since));

  let query = db.select({ count: sql<number>`count(*)` }).from(visitors);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  const result = query.get();
  return result?.count || 0;
}

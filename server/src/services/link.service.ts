import { db } from '../db/index.js';
import { links } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function createLink(targetUrl: string, templateId: string, title?: string, templateOptions?: object, gpsMode?: string, domainId?: number) {
  const slug = nanoid(8);
  const result = db.insert(links).values({
    slug,
    targetUrl,
    templateId,
    title: title || null,
    templateOptions: templateOptions ? JSON.stringify(templateOptions) : null,
    gpsMode: gpsMode || 'optional',
    domainId: domainId || null,
  }).returning().get();
  return result;
}

export function getAllLinks() {
  return db.select().from(links).orderBy(sql`${links.createdAt} DESC`).all();
}

export function getLinkById(id: number) {
  return db.select().from(links).where(eq(links.id, id)).get();
}

export function getLinkBySlug(slug: string) {
  return db.select().from(links).where(eq(links.slug, slug)).get();
}

export function updateLink(id: number, data: { title?: string; isActive?: boolean; templateOptions?: string; gpsMode?: string; domainId?: number | null }) {
  return db.update(links).set(data).where(eq(links.id, id)).returning().get();
}

export function deleteLink(id: number) {
  return db.delete(links).where(eq(links.id, id)).run();
}

export function incrementVisitCount(id: number) {
  return db.update(links)
    .set({ visitCount: sql`${links.visitCount} + 1` })
    .where(eq(links.id, id))
    .run();
}

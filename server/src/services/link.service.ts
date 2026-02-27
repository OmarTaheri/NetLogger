import { db } from '../db/index.js';
import { links } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as domainService from './domain.service.js';
import { config } from '../config.js';

export function createLink(
  targetUrl: string,
  templateId: string,
  title?: string,
  templateOptions?: object,
  gpsMode?: string,
  domainId?: number,
  expiresAt?: string | null,
  maxVisits?: number | null
) {
  const slug = nanoid(8);
  const result = db.insert(links).values({
    slug,
    targetUrl,
    templateId,
    title: title || null,
    templateOptions: templateOptions ? JSON.stringify(templateOptions) : null,
    gpsMode: gpsMode || 'optional',
    domainId: domainId || null,
    expiresAt: expiresAt || null,
    maxVisits: maxVisits || null,
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

export function updateLink(id: number, data: {
  title?: string;
  isActive?: boolean;
  templateOptions?: string;
  gpsMode?: string;
  domainId?: number | null;
  expiresAt?: string | null;
  maxVisits?: number | null;
}) {
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

export function getTrackingUrl(link: { templateId: string; slug: string; domainId: number | null }) {
  if (link.domainId) {
    const domain = domainService.getDomainById(link.domainId);
    if (domain && domain.isActive) {
      return `https://${domain.domain}/t/${link.templateId}/${link.slug}`;
    }
  }
  return `${config.baseUrl}/t/${link.templateId}/${link.slug}`;
}

export function isLinkExpired(link: { expiresAt: string | null; maxVisits: number | null; visitCount: number }): boolean {
  if (link.expiresAt) {
    const expiryDate = new Date(link.expiresAt);
    if (expiryDate < new Date()) return true;
  }
  if (link.maxVisits !== null && link.maxVisits > 0) {
    if (link.visitCount >= link.maxVisits) return true;
  }
  return false;
}

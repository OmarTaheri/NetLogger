import { db } from '../database/index.js';
import { links } from '../database/schema.js';
import { and, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as domainService from './domain.service.js';
import { config } from '../config.js';

export async function createLink(
  userId: number,
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
  const result = (await db.insert(links).values({
    userId,
    slug,
    targetUrl,
    templateId,
    title: title || null,
    templateOptions: templateOptions ? JSON.stringify(templateOptions) : null,
    gpsMode: gpsMode || 'optional',
    domainId: domainId || null,
    expiresAt: expiresAt || null,
    maxVisits: maxVisits || null,
  }).returning())[0];
  return result;
}

export async function getAllLinks(userId: number) {
  return db.select().from(links).where(eq(links.userId, userId)).orderBy(sql`${links.createdAt} DESC`);
}

export async function getLinkById(userId: number, id: number) {
  return (await db.select().from(links).where(and(eq(links.id, id), eq(links.userId, userId))).limit(1))[0];
}

export async function getLinkBySlug(slug: string) {
  return (await db.select().from(links).where(eq(links.slug, slug)).limit(1))[0];
}

export async function updateLink(userId: number, id: number, data: {
  title?: string;
  isActive?: boolean;
  templateOptions?: string;
  gpsMode?: string;
  domainId?: number | null;
  expiresAt?: string | null;
  maxVisits?: number | null;
}) {
  return (await db.update(links).set(data).where(and(eq(links.id, id), eq(links.userId, userId))).returning())[0];
}

export async function deleteLink(userId: number, id: number) {
  return (await db.delete(links).where(and(eq(links.id, id), eq(links.userId, userId))).returning())[0];
}

export async function incrementVisitCount(id: number) {
  return db.update(links)
    .set({ visitCount: sql`${links.visitCount} + 1` })
    .where(eq(links.id, id))
    ;
}

export async function getTrackingUrl(link: { userId: number; templateId: string; slug: string; domainId: number | null }) {
  if (link.domainId) {
    const domain = await domainService.getDomainById(link.domainId, link.userId);
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

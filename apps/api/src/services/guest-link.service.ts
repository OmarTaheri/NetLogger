import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../database/index.js';
import { links, users, visitors } from '../database/schema.js';
import { config } from '../config.js';
import * as linkService from './link.service.js';

export const GUEST_LINK_USERNAME = '__netlogger_guest_links__';
export const GUEST_LINK_MAX_VISITS = 25;
export const GUEST_LINK_LIFETIME_HOURS = 24;

export type GuestTemplateId = 'redirect' | 'captcha';

interface CreateGuestLinkInput {
  targetUrl: string;
  templateId: GuestTemplateId;
  title?: string;
  templateOptions?: Record<string, unknown>;
  gpsMode: 'optional' | 'disabled';
}

async function getGuestOwner(createIfMissing: boolean) {
  const existing = (await db.select().from(users).where(eq(users.username, GUEST_LINK_USERNAME)).limit(1))[0];
  if (existing || !createIfMissing) return existing;

  try {
    return (await db.insert(users).values({
      username: GUEST_LINK_USERNAME,
      displayName: 'NetLogger Guest Links',
      passwordHash: null,
      email: null,
    }).returning())[0];
  } catch {
    return (await db.select().from(users).where(eq(users.username, GUEST_LINK_USERNAME)).limit(1))[0];
  }
}

function resultsToken(slug: string) {
  return createHmac('sha256', config.sessionSecret)
    .update(`netlogger:guest-results:${slug}`)
    .digest('base64url');
}

function tokenMatches(slug: string, supplied: string) {
  const expected = Buffer.from(resultsToken(slug));
  const received = Buffer.from(supplied || '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function createGuestLink(input: CreateGuestLinkInput, baseUrl = config.baseUrl) {
  const owner = await getGuestOwner(true);
  if (!owner) throw new Error('Guest link owner is unavailable');

  const expiresAt = new Date(Date.now() + GUEST_LINK_LIFETIME_HOURS * 60 * 60 * 1000).toISOString();
  const link = await linkService.createLink(
    owner.id,
    input.targetUrl,
    input.templateId,
    input.title,
    input.templateOptions,
    input.gpsMode,
    undefined,
    expiresAt,
    GUEST_LINK_MAX_VISITS,
  );
  const token = resultsToken(link.slug);

  return {
    slug: link.slug,
    title: link.title,
    templateId: link.templateId,
    trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
    resultsUrl: `${baseUrl.replace(/\/$/, '')}/create/results/${link.slug}#${token}`,
    resultsToken: token,
    expiresAt: link.expiresAt,
    maxVisits: link.maxVisits,
    visitCount: link.visitCount,
  };
}

export async function getGuestLinkResults(slug: string, suppliedToken: string, baseUrl = config.baseUrl) {
  if (!tokenMatches(slug, suppliedToken)) return null;
  const owner = await getGuestOwner(false);
  if (!owner) return null;
  const link = (await db.select().from(links).where(and(eq(links.slug, slug), eq(links.userId, owner.id))).limit(1))[0];
  if (!link) return null;

  const recentVisitors = await db.select({
    id: visitors.id,
    createdAt: visitors.createdAt,
    ipCity: visitors.ipCity,
    ipCountry: visitors.ipCountry,
    browser: visitors.browser,
    os: visitors.os,
    deviceTier: visitors.deviceTier,
    humanScore: visitors.humanScore,
    vpnDetected: visitors.vpnDetected,
  }).from(visitors)
    .where(eq(visitors.linkId, link.id))
    .orderBy(desc(visitors.createdAt))
    .limit(10);

  return {
    link: {
      slug: link.slug,
      title: link.title,
      templateId: link.templateId,
      trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
      visitCount: link.visitCount,
      expiresAt: link.expiresAt,
      maxVisits: link.maxVisits,
      isActive: link.isActive && !linkService.isLinkExpired(link),
    },
    recentVisitors,
    limitations: {
      visitorDetails: 'Coarse location and device summary only',
      historyLimit: 10,
      upgradeFeatures: ['Full fingerprints', 'GPS intelligence', 'Risk analysis', 'Exports', 'Custom domains', 'Webhooks'],
    },
  };
}

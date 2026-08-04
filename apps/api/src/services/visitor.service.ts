import { db } from '../database/index.js';
import { visitors, links } from '../database/schema.js';
import { eq, desc, sql, and, gte, lt, like, or, inArray } from 'drizzle-orm';

// Fields that use ?? (nullish coalescing) because 0/false are valid values
const NULLISH_FIELDS = new Set([
  'touchSupport', 'cookiesEnabled', 'doNotTrack',
  'webglMaxTextureSize', 'webglMaxViewportWidth', 'webglMaxViewportHeight',
  'downlinkSpeed', 'networkRtt', 'saveData',
  'cameraCount', 'microphoneCount', 'speakerCount',
  'screenAvailWidth', 'screenAvailHeight', 'pixelDepth', 'devicePixelRatio',
  'isOnline', 'pdfViewerEnabled', 'webdriverDetected',
  'storageQuota', 'storageUsage',
  'pageLoadTime', 'adBlockerDetected', 'incognitoDetected',
  'prefersReducedMotion', 'hdrSupport', 'forcedColors',
  'batteryLevel', 'batteryCharging',
  'jsHeapSizeLimit', 'multiMonitor', 'maxTouchPoints',
  'timezoneOffset', 'observesDst',
  'scrollbarWidth', 'dwellTime',
  'gpsGranted', 'latitude', 'longitude', 'accuracy', 'altitude',
  'altitudeAccuracy', 'speed', 'heading',
  'cpuCores', 'ram', 'screenWidth', 'screenHeight', 'colorDepth',
]);

// All fields from the request body that we accept
const VISITOR_FIELDS = [
  'browser', 'browserVersion', 'os', 'platform',
  'cpuCores', 'ram', 'screenWidth', 'screenHeight', 'colorDepth',
  'gpuVendor', 'gpuRenderer', 'canvasHash', 'touchSupport',
  'language', 'timezone', 'cookiesEnabled', 'doNotTrack',
  'audioHash', 'webglMaxTextureSize', 'webglMaxViewportWidth',
  'webglMaxViewportHeight', 'webglExtensions', 'webglShaderPrecision',
  'connectionType', 'downlinkSpeed', 'networkRtt', 'saveData',
  'cameraCount', 'microphoneCount', 'speakerCount',
  'screenAvailWidth', 'screenAvailHeight', 'pixelDepth', 'devicePixelRatio',
  'screenOrientation', 'vendor', 'isOnline', 'pdfViewerEnabled', 'webdriverDetected',
  'storageQuota', 'storageUsage', 'installedLanguages',
  'permGeolocation', 'permCamera', 'permMicrophone', 'permNotifications',
  'referrer', 'pageLoadTime', 'adBlockerDetected', 'incognitoDetected',
  'localIPs', 'speechVoicesHash', 'detectedFonts',
  'prefersColorScheme', 'prefersReducedMotion', 'hdrSupport', 'forcedColors',
  'pointerType', 'colorGamut',
  'clientArch', 'clientBitness', 'clientPlatformVersion', 'clientModel',
  'batteryLevel', 'batteryCharging',
  'intlLocaleFingerprint', 'jsHeapSizeLimit',
  'multiMonitor', 'maxTouchPoints',
  'installedPlugins', 'apiSupport',
  'timezoneOffset', 'observesDst',
  'navigationType', 'keyboardLayout',
  'mathFingerprint', 'domRectFingerprint', 'mediaCodecFingerprint',
  'audioContextProps', 'cssSystemColorFingerprint', 'webgl2Fingerprint',
  'svgFilterFingerprint', 'errorMessageFingerprint', 'wasmCapabilities',
  'scrollbarWidth', 'timerResolution', 'textMetricsFingerprint',
  'dateToStringFingerprint', 'emojiSupportFingerprint', 'perfEntryTypes',
  'securityContext', 'cssSupportFingerprint', 'lineBreakFingerprint',
  'mouseData', 'clickData', 'scrollData', 'touchData', 'motionData',
  'dwellTime', 'focusData',
  'gpsGranted', 'latitude', 'longitude', 'accuracy', 'altitude',
  'altitudeAccuracy', 'speed', 'heading',
];

export function buildVisitorFromRequest(
  body: Record<string, any>,
  linkId: number,
  ip: string,
  userAgent: string,
  geoip: Record<string, any>,
): Record<string, unknown> {
  const data: Record<string, unknown> = { linkId, ip, userAgent };

  for (const field of VISITOR_FIELDS) {
    if (NULLISH_FIELDS.has(field)) {
      data[field] = body[field] ?? (field === 'gpsGranted' ? false : null);
    } else {
      data[field] = body[field] || null;
    }
  }

  Object.assign(data, geoip);
  return data;
}

export async function createVisitor(data: Record<string, unknown>) {
  return (await db.insert(visitors).values(data as any).returning())[0];
}

export interface VisitorFilters {
  linkId?: number;
  limit?: number;
  offset?: number;
  since?: string;
  ip?: string;
  country?: string;
  browser?: string;
  os?: string;
  gpsGranted?: boolean;
  botScoreMin?: number;
  botScoreMax?: number;
  vpnDetected?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildConditions(userId: number, filters: VisitorFilters) {
  const conditions = [eq(links.userId, userId)];
  if (filters.linkId) conditions.push(eq(visitors.linkId, filters.linkId));
  if (filters.since) conditions.push(gte(visitors.createdAt, filters.since));
  if (filters.ip) conditions.push(like(visitors.ip, `%${filters.ip}%`));
  if (filters.country) conditions.push(eq(visitors.ipCountry, filters.country));
  if (filters.browser) conditions.push(eq(visitors.browser, filters.browser));
  if (filters.os) conditions.push(eq(visitors.os, filters.os));
  if (filters.gpsGranted !== undefined) conditions.push(eq(visitors.gpsGranted, filters.gpsGranted));
  if (filters.botScoreMin !== undefined) conditions.push(gte(visitors.botScore, filters.botScoreMin));
  if (filters.botScoreMax !== undefined) conditions.push(sql`${visitors.botScore} <= ${filters.botScoreMax}`);
  if (filters.vpnDetected !== undefined) conditions.push(eq(visitors.vpnDetected, filters.vpnDetected));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        like(visitors.ip, term),
        like(visitors.browser, term),
        like(visitors.os, term),
        like(visitors.ipCity, term),
        like(visitors.ipCountry, term),
      )!
    );
  }
  return conditions;
}

const SORT_COLUMNS: Record<string, any> = {
  createdAt: visitors.createdAt,
  browser: visitors.browser,
  os: visitors.os,
  ip: visitors.ip,
  botScore: visitors.botScore,
  ipCountry: visitors.ipCountry,
};

export async function getVisitors(userId: number, filters: VisitorFilters) {
  const { limit = 50, offset = 0 } = filters;
  const conditions = buildConditions(userId, filters);

  const sortCol = SORT_COLUMNS[filters.sortBy || ''] || visitors.createdAt;
  const orderFn = filters.sortOrder === 'asc' ? sql`${sortCol} ASC` : sql`${sortCol} DESC`;

  let query = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id))
    .orderBy(orderFn)
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const results = await query;
  return results.map(r => ({
    ...r.visitor,
    linkSlug: r.linkSlug,
    linkTitle: r.linkTitle,
  }));
}

export async function getVisitorById(userId: number, id: number) {
  const result = (await db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id))
    .where(and(eq(visitors.id, id), eq(links.userId, userId)))
    .limit(1))[0];

  if (!result) return null;
  return { ...result.visitor, linkSlug: result.linkSlug, linkTitle: result.linkTitle };
}

export async function deleteVisitor(userId: number, id: number) {
  const owned = await getVisitorById(userId, id);
  if (!owned) return null;
  return (await db.delete(visitors).where(eq(visitors.id, id)).returning())[0];
}

export async function updateVisitor(id: number, data: Record<string, unknown>) {
  return db.update(visitors).set(data as any).where(eq(visitors.id, id));
}

export async function getVisitorCount(userId: number, filters: VisitorFilters = {}) {
  const conditions = buildConditions(userId, filters);
  let query = db.select({ count: sql<number>`count(*)::int` }).from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id));
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  const result = (await query.limit(1))[0];
  return result?.count || 0;
}

async function ownedVisitorIds(userId: number, extraConditions: any[]) {
  return (await db.select({ id: visitors.id }).from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id))
    .where(and(eq(links.userId, userId), ...extraConditions))).map((row) => row.id);
}

export async function deleteVisitorsByIds(userId: number, ids: number[]) {
  if (ids.length === 0) return 0;
  const ownedIds = await ownedVisitorIds(userId, [inArray(visitors.id, ids)]);
  if (ownedIds.length === 0) return 0;
  const result = await db.delete(visitors).where(inArray(visitors.id, ownedIds)).returning({ id: visitors.id });
  return result.length;
}

export async function deleteVisitorsByLinkId(userId: number, linkId: number) {
  const ownedIds = await ownedVisitorIds(userId, [eq(visitors.linkId, linkId)]);
  if (ownedIds.length === 0) return 0;
  const result = await db.delete(visitors).where(inArray(visitors.id, ownedIds)).returning({ id: visitors.id });
  return result.length;
}

export async function deleteVisitorsOlderThan(userId: number, date: string) {
  const ownedIds = await ownedVisitorIds(userId, [lt(visitors.createdAt, date)]);
  if (ownedIds.length === 0) return 0;
  const result = await db.delete(visitors).where(inArray(visitors.id, ownedIds)).returning({ id: visitors.id });
  return result.length;
}

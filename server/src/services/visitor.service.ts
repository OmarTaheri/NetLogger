import { db } from '../db/index.js';
import { visitors, links } from '../db/schema.js';
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

export function createVisitor(data: Record<string, unknown>) {
  return db.insert(visitors).values(data as any).returning().get();
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

function buildConditions(filters: VisitorFilters) {
  const conditions = [];
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

export function getVisitors(filters: VisitorFilters) {
  const { limit = 50, offset = 0 } = filters;
  const conditions = buildConditions(filters);

  const sortCol = SORT_COLUMNS[filters.sortBy || ''] || visitors.createdAt;
  const orderFn = filters.sortOrder === 'asc' ? sql`${sortCol} ASC` : sql`${sortCol} DESC`;

  let query = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .leftJoin(links, eq(visitors.linkId, links.id))
    .orderBy(orderFn)
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

export function getVisitorCount(filters: VisitorFilters = {}) {
  const conditions = buildConditions(filters);
  let query = db.select({ count: sql<number>`count(*)` }).from(visitors);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  const result = query.get();
  return result?.count || 0;
}

export function deleteVisitorsByIds(ids: number[]) {
  if (ids.length === 0) return 0;
  const result = db.delete(visitors).where(inArray(visitors.id, ids)).run();
  return result.changes;
}

export function deleteVisitorsByLinkId(linkId: number) {
  const result = db.delete(visitors).where(eq(visitors.linkId, linkId)).run();
  return result.changes;
}

export function deleteVisitorsOlderThan(date: string) {
  const result = db.delete(visitors).where(lt(visitors.createdAt, date)).run();
  return result.changes;
}

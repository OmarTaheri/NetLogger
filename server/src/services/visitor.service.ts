import { db } from '../db/index.js';
import { visitors, links } from '../db/schema.js';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

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

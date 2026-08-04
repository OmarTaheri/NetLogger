import bcrypt from 'bcrypt';
import { and, eq, inArray } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../database/index.js';
import { links, users, visitors } from '../database/schema.js';
import { logger } from '../utils/logger.js';

const DEMO_LINK_DEFINITIONS = [
  {
    key: 'launch',
    title: 'Demo · Product launch',
    targetUrl: 'https://example.com/product-launch',
    templateId: 'redirect',
    templateOptions: { loadingMessage: 'Preparing your launch brief', subMessage: 'Opening the campaign destination' },
    gpsMode: 'optional',
  },
  {
    key: 'brief',
    title: 'Demo · Shared launch brief',
    targetUrl: 'https://example.com/shared-brief',
    templateId: 'gdrive',
    templateOptions: { fileName: 'Launch-brief.pdf', fileType: 'pdf', fileSize: '6.2 MB', ownerEmail: 'team@example.test' },
    gpsMode: 'required',
  },
  {
    key: 'assets',
    title: 'Demo · Campaign assets',
    targetUrl: 'https://example.com/campaign-assets',
    templateId: 'dropbox',
    templateOptions: { folderName: 'Campaign assets', ownerEmail: 'team@example.test', message: 'Your campaign assets are ready to review.' },
    gpsMode: 'optional',
  },
] as const;

const DEMO_LOCATIONS = [
  { city: 'New York', region: 'New York', country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.006 },
  { city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5072, longitude: -0.1276 },
  { city: 'Singapore', region: 'Central Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198 },
  { city: 'Berlin', region: 'Berlin', country: 'Germany', countryCode: 'DE', latitude: 52.52, longitude: 13.405 },
  { city: 'Sydney', region: 'New South Wales', country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093 },
] as const;

const DEMO_CLIENTS = [
  { browser: 'Chrome', browserVersion: '128.0', os: 'Windows 11', platform: 'Win32', userAgent: 'Mozilla/5.0 Demo Chrome Windows' },
  { browser: 'Safari', browserVersion: '17.6', os: 'macOS', platform: 'MacIntel', userAgent: 'Mozilla/5.0 Demo Safari macOS' },
  { browser: 'Firefox', browserVersion: '130.0', os: 'Ubuntu', platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 Demo Firefox Linux' },
  { browser: 'Chrome Mobile', browserVersion: '128.0', os: 'Android', platform: 'Linux armv8l', userAgent: 'Mozilla/5.0 Demo Chrome Android' },
  { browser: 'Mobile Safari', browserVersion: '17.6', os: 'iOS', platform: 'iPhone', userAgent: 'Mozilla/5.0 Demo Safari iPhone' },
] as const;

function demoSlug(userId: number, key: string) {
  return `netlogger-demo-${userId}-${key}`;
}

/**
 * Replaces only NetLogger's reserved sample links for the configured demo
 * account. Each restart therefore produces fresh, recent analytics without
 * duplicating records or touching real user data.
 */
export async function refreshDemoData(userId: number) {
  const slugs = DEMO_LINK_DEFINITIONS.map((definition) => demoSlug(userId, definition.key));
  const now = Date.now();

  await db.transaction(async (tx) => {
    const oldLinks = await tx.select({ id: links.id }).from(links)
      .where(and(eq(links.userId, userId), inArray(links.slug, slugs)));
    if (oldLinks.length > 0) {
      await tx.delete(links).where(inArray(links.id, oldLinks.map((link) => link.id)));
    }

    const seededLinks = await tx.insert(links).values(DEMO_LINK_DEFINITIONS.map((definition) => ({
      userId,
      slug: demoSlug(userId, definition.key),
      title: definition.title,
      targetUrl: definition.targetUrl,
      templateId: definition.templateId,
      templateOptions: JSON.stringify(definition.templateOptions),
      gpsMode: definition.gpsMode,
      isActive: true,
    }))).returning({ id: links.id });

    const visitorRows: (typeof visitors.$inferInsert)[] = Array.from({ length: 36 }, (_, index) => {
      const location = DEMO_LOCATIONS[index % DEMO_LOCATIONS.length];
      const client = DEMO_CLIENTS[index % DEMO_CLIENTS.length];
      const gpsGranted = index % 3 !== 0;
      const hoursAgo = index < 12 ? 0.5 + index * 1.75 : 24 + (index - 12) * 12;
      const link = seededLinks[index % seededLinks.length];

      return {
        linkId: link.id,
        ip: `198.51.100.${20 + index}`,
        userAgent: client.userAgent,
        browser: client.browser,
        browserVersion: client.browserVersion,
        os: client.os,
        platform: client.platform,
        screenWidth: index % 2 === 0 ? 1920 : 390,
        screenHeight: index % 2 === 0 ? 1080 : 844,
        language: 'en-US',
        timezone: index % 2 === 0 ? 'America/New_York' : 'Europe/London',
        connectionType: index % 3 === 0 ? '4g' : 'wifi',
        gpsGranted,
        latitude: gpsGranted ? location.latitude + (index % 4) * 0.003 : null,
        longitude: gpsGranted ? location.longitude + (index % 4) * 0.003 : null,
        accuracy: gpsGranted ? 18 + index : null,
        ipCity: location.city,
        ipRegion: location.region,
        ipCountry: location.country,
        ipCountryCode: location.countryCode,
        ipLat: location.latitude,
        ipLon: location.longitude,
        ipIsp: 'NetLogger sample network',
        botScore: index % 8 === 0 ? 82 : 8 + (index % 5) * 9,
        vpnDetected: index % 9 === 0,
        privacyScore: 52 + (index % 5) * 8,
        deviceTier: index % 2 === 0 ? 'desktop' : 'mobile',
        browserAuthenticity: 'likely_genuine',
        uniquenessScore: 58 + (index % 6) * 5,
        locationConsistency: gpsGranted ? 'consistent' : 'ip_only',
        humanScore: index % 8 === 0 ? 34 : 91,
        riskFlags: index % 8 === 0 ? JSON.stringify(['high_bot_score']) : JSON.stringify([]),
        createdAt: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
      };
    });

    await tx.insert(visitors).values(visitorRows);
    for (const link of seededLinks) {
      await tx.update(links)
        .set({ visitCount: visitorRows.filter((visitor) => visitor.linkId === link.id).length })
        .where(eq(links.id, link.id));
    }
  });

  logger.info({ userId }, 'Demo analytics data refreshed');
}

export async function ensureDefaultAccounts() {
  let admin = (await db.select().from(users).where(eq(users.email, config.adminEmail.trim().toLowerCase())).limit(1))[0]
    ?? (await db.select().from(users).where(eq(users.username, config.adminUsername)).limit(1))[0];
  if (!admin) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);
    admin = (await db.insert(users).values({
      username: config.adminUsername,
      email: config.adminEmail.trim().toLowerCase(),
      displayName: 'Administrator',
      passwordHash,
      role: 'admin',
    }).returning())[0];
    logger.info(`Administrator "${config.adminEmail}" created`);
  } else if (!admin.email || admin.role !== 'admin') {
    admin = (await db.update(users).set({
      email: admin.email || config.adminEmail.trim().toLowerCase(),
      role: 'admin',
    }).where(eq(users.id, admin.id)).returning())[0];
  }

  const defaultUserEmail = config.defaultUserEmail.trim().toLowerCase();
  let demoUser = defaultUserEmail
    ? (await db.select().from(users).where(eq(users.email, defaultUserEmail)).limit(1))[0]
    : undefined;
  if (defaultUserEmail && !demoUser) {
    const passwordHash = await bcrypt.hash(config.defaultUserPassword, 10);
    demoUser = (await db.insert(users).values({
      email: defaultUserEmail,
      displayName: config.defaultUserDisplayName,
      passwordHash,
      role: 'user',
    }).returning())[0];
    logger.info(`Default user "${defaultUserEmail}" created`);
  }

  return { admin, demoUser };
}

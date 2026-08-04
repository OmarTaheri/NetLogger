import { beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray, sql } from 'drizzle-orm';
import { initDb, db } from '../src/database/index.js';
import { links, users, visitors } from '../src/database/schema.js';
import { refreshDemoData } from '../src/services/seed.service.js';

let demoUserId: number;

async function seededLinks() {
  return db.select().from(links).where(eq(links.userId, demoUserId));
}

async function seededVisitorCount(linkIds: number[]) {
  if (linkIds.length === 0) return 0;
  return (await db.select({ count: sql<number>`count(*)::int` }).from(visitors)
    .where(inArray(visitors.linkId, linkIds)))[0]?.count || 0;
}

beforeAll(async () => {
  await initDb();
  demoUserId = (await db.insert(users).values({
    email: 'seeded-demo@example.test',
    displayName: 'Seeded Demo User',
    role: 'user',
  }).returning({ id: users.id }))[0].id;
});

describe('Demo data seeding', () => {
  it('creates a useful set of links and recent visitor analytics', async () => {
    await refreshDemoData(demoUserId);
    const firstSeed = await seededLinks();

    expect(firstSeed).toHaveLength(3);
    expect(firstSeed.every((link) => link.slug.startsWith(`netlogger-demo-${demoUserId}-`))).toBe(true);
    expect(firstSeed.reduce((sum, link) => sum + link.visitCount, 0)).toBe(36);
    expect(await seededVisitorCount(firstSeed.map((link) => link.id))).toBe(36);
  });

  it('refreshes reserved demo records instead of adding duplicates on the next start', async () => {
    await refreshDemoData(demoUserId);
    const refreshedSeed = await seededLinks();

    expect(refreshedSeed).toHaveLength(3);
    expect(await seededVisitorCount(refreshedSeed.map((link) => link.id))).toBe(36);
    expect(refreshedSeed.reduce((sum, link) => sum + link.visitCount, 0)).toBe(36);
  });
});

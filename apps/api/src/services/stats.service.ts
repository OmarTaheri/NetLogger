import { db } from '../database/index.js';
import { visitors, links } from '../database/schema.js';
import { eq, sql, gte, and } from 'drizzle-orm';

export async function getStats(userId: number, linkId?: number) {
  if (linkId) {
    const ownedLink = (await db.select({ id: links.id }).from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, userId))).limit(1))[0];
    if (!ownedLink) return null;
  }

  const ownerCondition = linkId
    ? and(eq(links.userId, userId), eq(visitors.linkId, linkId))!
    : eq(links.userId, userId);
  const visitorBase = () => db.select({ count: sql<number>`count(*)::int` }).from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id));

  const totalLinks = (await db.select({ count: sql<number>`count(*)::int` }).from(links)
    .where(eq(links.userId, userId)))[0]?.count || 0;
  const totalVisitors = (await visitorBase().where(ownerCondition))[0]?.count || 0;
  const gpsGrantedCount = (await visitorBase()
    .where(and(ownerCondition, eq(visitors.gpsGranted, true))))[0]?.count || 0;
  const today = new Date().toISOString().split('T')[0];
  const visitorsToday = (await visitorBase()
    .where(and(ownerCondition, gte(visitors.createdAt, today))))[0]?.count || 0;

  const topBrowsers = (await db.select({ name: visitors.browser, count: sql<number>`count(*)::int` })
    .from(visitors).innerJoin(links, eq(visitors.linkId, links.id))
    .where(ownerCondition).groupBy(visitors.browser).orderBy(sql`count(*) DESC`).limit(5))
    .filter((item) => item.name);
  const topOS = (await db.select({ name: visitors.os, count: sql<number>`count(*)::int` })
    .from(visitors).innerJoin(links, eq(visitors.linkId, links.id))
    .where(ownerCondition).groupBy(visitors.os).orderBy(sql`count(*) DESC`).limit(5))
    .filter((item) => item.name);
  const visitorsPerDay = await db.select({
    date: sql<string>`left(${visitors.createdAt}, 10)`,
    count: sql<number>`count(*)::int`,
  }).from(visitors).innerJoin(links, eq(visitors.linkId, links.id))
    .where(ownerCondition).groupBy(sql`left(${visitors.createdAt}, 10)`)
    .orderBy(sql`left(${visitors.createdAt}, 10) DESC`).limit(30);

  return {
    totalLinks,
    totalVisitors,
    gpsGrantedCount,
    gpsGrantRate: totalVisitors > 0 ? Math.round((gpsGrantedCount / totalVisitors) * 100) : 0,
    visitorsToday,
    topBrowsers,
    topOS,
    visitorsPerDay: visitorsPerDay.reverse(),
  };
}

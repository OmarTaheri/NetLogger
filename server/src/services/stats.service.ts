import { db } from '../db/index.js';
import { visitors, links } from '../db/schema.js';
import { eq, sql, gte, and } from 'drizzle-orm';

export function getStats(linkId?: number) {
  const whereClause = linkId ? eq(visitors.linkId, linkId) : undefined;

  const totalLinks = db.select({ count: sql<number>`count(*)` }).from(links).get()?.count || 0;

  const totalVisitors = db.select({ count: sql<number>`count(*)` })
    .from(visitors)
    .where(whereClause)
    .get()?.count || 0;

  const gpsGrantedCount = db.select({ count: sql<number>`count(*)` })
    .from(visitors)
    .where(whereClause ? and(whereClause, eq(visitors.gpsGranted, true)) : eq(visitors.gpsGranted, true))
    .get()?.count || 0;

  const today = new Date().toISOString().split('T')[0];
  const visitorsToday = db.select({ count: sql<number>`count(*)` })
    .from(visitors)
    .where(whereClause
      ? and(whereClause, gte(visitors.createdAt, today))
      : gte(visitors.createdAt, today))
    .get()?.count || 0;

  const topBrowsers = db.select({
    name: visitors.browser,
    count: sql<number>`count(*)`,
  })
    .from(visitors)
    .where(whereClause)
    .groupBy(visitors.browser)
    .orderBy(sql`count(*) DESC`)
    .limit(5)
    .all()
    .filter(b => b.name);

  const topOS = db.select({
    name: visitors.os,
    count: sql<number>`count(*)`,
  })
    .from(visitors)
    .where(whereClause)
    .groupBy(visitors.os)
    .orderBy(sql`count(*) DESC`)
    .limit(5)
    .all()
    .filter(o => o.name);

  const visitorsPerDay = db.select({
    date: sql<string>`date(${visitors.createdAt})`,
    count: sql<number>`count(*)`,
  })
    .from(visitors)
    .where(whereClause)
    .groupBy(sql`date(${visitors.createdAt})`)
    .orderBy(sql`date(${visitors.createdAt}) DESC`)
    .limit(30)
    .all();

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

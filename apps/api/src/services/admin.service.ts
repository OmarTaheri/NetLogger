import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../database/index.js';
import { domains, links, users, visitors } from '../database/schema.js';

export async function getAdminOverview() {
  const [totalUsers, standardUsers, totalLinks, activeLinks, totalVisitors] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'user')),
    db.select({ count: sql<number>`count(*)::int` }).from(links),
    db.select({ count: sql<number>`count(*)::int` }).from(links).where(eq(links.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(visitors),
  ]);

  return {
    totalUsers: totalUsers[0]?.count || 0,
    standardUsers: standardUsers[0]?.count || 0,
    totalLinks: totalLinks[0]?.count || 0,
    activeLinks: activeLinks[0]?.count || 0,
    totalVisitors: totalVisitors[0]?.count || 0,
  };
}

export async function getAdminUsers() {
  const accountRows = await db.select().from(users).orderBy(desc(users.createdAt));

  return Promise.all(accountRows.map(async (user) => {
    const [linkCount, visitorCount, lastActivity] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(links).where(eq(links.userId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(visitors)
        .innerJoin(links, eq(visitors.linkId, links.id))
        .where(eq(links.userId, user.id)),
      db.execute<{ lastActivityAt: string | null }>(sql`SELECT max(created_at) AS "lastActivityAt" FROM audit_logs WHERE user_id = ${user.id}`),
    ]);

    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      linkCount: linkCount[0]?.count || 0,
      visitorCount: visitorCount[0]?.count || 0,
      lastActivityAt: lastActivity.rows[0]?.lastActivityAt || null,
      providers: [user.passwordHash ? 'password' : null, user.googleSubject ? 'google' : null].filter(Boolean),
    };
  }));
}

export async function getAdminDomains() {
  const domainRows = await db.select({
    id: domains.id,
    domain: domains.domain,
    isActive: domains.isActive,
    createdAt: domains.createdAt,
    ownerId: users.id,
    ownerDisplayName: users.displayName,
    ownerEmail: users.email,
  }).from(domains)
    .innerJoin(users, eq(domains.userId, users.id))
    .orderBy(desc(domains.createdAt));

  return Promise.all(domainRows.map(async (domain) => {
    const linkCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(links)
      .where(eq(links.domainId, domain.id));
    return { ...domain, linkCount: linkCount[0]?.count || 0 };
  }));
}

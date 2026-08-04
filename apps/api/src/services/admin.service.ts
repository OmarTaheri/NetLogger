import { eq, sql } from 'drizzle-orm';
import { db } from '../database/index.js';
import { links, users, visitors } from '../database/schema.js';

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
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.display_name AS "displayName",
      u.email,
      u.username,
      u.role,
      u.password_hash AS "passwordHash",
      u.google_subject AS "googleSubject",
      u.created_at AS "createdAt",
      (SELECT count(*)::int FROM links l WHERE l.user_id = u.id) AS "linkCount",
      (SELECT count(*)::int FROM visitors v INNER JOIN links l ON v.link_id = l.id WHERE l.user_id = u.id) AS "visitorCount",
      (SELECT max(a.created_at) FROM audit_logs a WHERE a.user_id = u.id) AS "lastActivityAt"
    FROM users u
    ORDER BY u.created_at DESC
  `);
  const rows = result.rows as Array<{
    id: number;
    displayName: string;
    email: string | null;
    username: string | null;
    role: 'user' | 'admin';
    passwordHash: string | null;
    googleSubject: string | null;
    createdAt: string;
    linkCount: number;
    visitorCount: number;
    lastActivityAt: string | null;
  }>;

  return rows.map(({ passwordHash, googleSubject, ...user }) => ({
    ...user,
    providers: [passwordHash ? 'password' : null, googleSubject ? 'google' : null].filter(Boolean),
  }));
}

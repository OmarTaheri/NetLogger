import { db } from '../database/index.js';
import { auditLogs } from '../database/schema.js';
import { desc, eq } from 'drizzle-orm';

export async function logAction(
  userId: number | null,
  action: string,
  targetType?: string,
  targetId?: number,
  details?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    targetType: targetType || null,
    targetId: targetId || null,
    details: details ? JSON.stringify(details) : null,
  });
}

export async function getAuditLogs(userId: number, limit = 100, offset = 0) {
  return db.select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
    ;
}

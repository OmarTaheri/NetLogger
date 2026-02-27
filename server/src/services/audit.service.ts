import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import { desc } from 'drizzle-orm';

export function logAction(
  adminId: number | null,
  action: string,
  targetType?: string,
  targetId?: number,
  details?: Record<string, unknown>
) {
  db.insert(auditLogs).values({
    adminId,
    action,
    targetType: targetType || null,
    targetId: targetId || null,
    details: details ? JSON.stringify(details) : null,
  }).run();
}

export function getAuditLogs(limit = 100, offset = 0) {
  return db.select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

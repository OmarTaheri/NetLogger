import { db } from '../database/index.js';
import { visitors } from '../database/schema.js';
import { lt } from 'drizzle-orm';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export async function cleanupOldVisitors() {
  if (!config.dataRetentionDays || config.dataRetentionDays <= 0) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.dataRetentionDays);
  const cutoffStr = cutoff.toISOString();

  const result = await db.delete(visitors).where(lt(visitors.createdAt, cutoffStr)).returning({ id: visitors.id });
  if (result.length > 0) {
    logger.info(`Cleanup: deleted ${result.length} visitors older than ${config.dataRetentionDays} days`);
  }
}

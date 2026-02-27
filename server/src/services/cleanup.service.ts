import { db } from '../db/index.js';
import { visitors } from '../db/schema.js';
import { lt } from 'drizzle-orm';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export function cleanupOldVisitors() {
  if (!config.dataRetentionDays || config.dataRetentionDays <= 0) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.dataRetentionDays);
  const cutoffStr = cutoff.toISOString();

  const result = db.delete(visitors).where(lt(visitors.createdAt, cutoffStr)).run();
  if (result.changes > 0) {
    logger.info(`Cleanup: deleted ${result.changes} visitors older than ${config.dataRetentionDays} days`);
  }
}

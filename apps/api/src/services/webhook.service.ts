import { db } from '../database/index.js';
import { webhooks } from '../database/schema.js';
import { and, eq, desc } from 'drizzle-orm';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { createHmac } from 'crypto';

export async function getAllWebhooks(userId: number) {
  return (await db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt))).map(w => ({
    ...w,
    events: JSON.parse(w.events) as string[],
  }));
}

export async function getWebhookById(userId: number, id: number) {
  const w = (await db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId))).limit(1))[0];
  if (!w) return null;
  return { ...w, events: JSON.parse(w.events) as string[] };
}

export async function createWebhook(userId: number, url: string, events: string[], secret?: string) {
  const result = (await db.insert(webhooks).values({
    userId,
    url,
    events: JSON.stringify(events),
    secret: secret || null,
  }).returning())[0];
  return { ...result, events: JSON.parse(result.events) as string[] };
}

export async function updateWebhook(userId: number, id: number, data: { url?: string; events?: string[]; secret?: string; isActive?: boolean }) {
  const updateData: Record<string, any> = {};
  if (data.url !== undefined) updateData.url = data.url;
  if (data.events !== undefined) updateData.events = JSON.stringify(data.events);
  if (data.secret !== undefined) updateData.secret = data.secret;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const result = (await db.update(webhooks).set(updateData).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId))).returning())[0];
  if (!result) return null;
  return { ...result, events: JSON.parse(result.events) as string[] };
}

export async function deleteWebhook(userId: number, id: number) {
  return (await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId))).returning())[0];
}

export async function fireWebhooks(userId: number, event: string, payload: Record<string, unknown>) {
  const allWebhooks = await db.select().from(webhooks).where(eq(webhooks.userId, userId));

  for (const webhook of allWebhooks) {
    if (!webhook.isActive) continue;
    const events = JSON.parse(webhook.events) as string[];
    if (!events.includes(event)) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (webhook.secret) {
      const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.webhookTimeout);
      await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      logger.warn({ err, webhookId: webhook.id, event }, 'Webhook delivery failed');
    }
  }
}

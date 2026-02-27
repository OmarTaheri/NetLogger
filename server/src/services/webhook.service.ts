import { db } from '../db/index.js';
import { webhooks } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { createHmac } from 'crypto';

export function getAllWebhooks() {
  return db.select().from(webhooks).orderBy(desc(webhooks.createdAt)).all().map(w => ({
    ...w,
    events: JSON.parse(w.events) as string[],
  }));
}

export function getWebhookById(id: number) {
  const w = db.select().from(webhooks).where(eq(webhooks.id, id)).get();
  if (!w) return null;
  return { ...w, events: JSON.parse(w.events) as string[] };
}

export function createWebhook(url: string, events: string[], secret?: string) {
  const result = db.insert(webhooks).values({
    url,
    events: JSON.stringify(events),
    secret: secret || null,
  }).returning().get();
  return { ...result, events: JSON.parse(result.events) as string[] };
}

export function updateWebhook(id: number, data: { url?: string; events?: string[]; secret?: string; isActive?: boolean }) {
  const updateData: Record<string, any> = {};
  if (data.url !== undefined) updateData.url = data.url;
  if (data.events !== undefined) updateData.events = JSON.stringify(data.events);
  if (data.secret !== undefined) updateData.secret = data.secret;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const result = db.update(webhooks).set(updateData).where(eq(webhooks.id, id)).returning().get();
  if (!result) return null;
  return { ...result, events: JSON.parse(result.events) as string[] };
}

export function deleteWebhook(id: number) {
  return db.delete(webhooks).where(eq(webhooks.id, id)).run();
}

export async function fireWebhooks(event: string, payload: Record<string, unknown>) {
  const allWebhooks = db.select().from(webhooks).all();

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

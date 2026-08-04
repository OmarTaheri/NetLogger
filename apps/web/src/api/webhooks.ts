import { api } from './client';
import type { Webhook } from '@netlogger/shared/types';

export function getWebhooks() {
  return api.get<Webhook[]>('/api/webhooks');
}

export function createWebhook(data: { url: string; events: string[]; secret?: string }) {
  return api.post<Webhook>('/api/webhooks', data);
}

export function updateWebhook(id: number, data: { url?: string; events?: string[]; secret?: string; isActive?: boolean }) {
  return api.patch<Webhook>(`/api/webhooks/${id}`, data);
}

export function deleteWebhook(id: number) {
  return api.delete<{ ok: boolean }>(`/api/webhooks/${id}`);
}

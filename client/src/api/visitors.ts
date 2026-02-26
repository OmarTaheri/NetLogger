import { api } from './client';
import type { Visitor, Stats } from 'shared/types';

export function getVisitors(params?: { linkId?: number; limit?: number; offset?: number; since?: string }) {
  const q = new URLSearchParams();
  if (params?.linkId) q.set('linkId', String(params.linkId));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  if (params?.since) q.set('since', params.since);
  const qs = q.toString();
  return api.get<{ visitors: Visitor[]; total: number }>(`/api/visitors${qs ? '?' + qs : ''}`);
}

export function getSinceTimestamp(timeframe: string): string | undefined {
  if (timeframe === 'all') return undefined;
  const now = new Date();
  const ms: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const offset = ms[timeframe];
  if (!offset) return undefined;
  return new Date(now.getTime() - offset).toISOString();
}

export function getVisitor(id: number) {
  return api.get<Visitor>(`/api/visitors/${id}`);
}

export function deleteVisitor(id: number) {
  return api.delete<{ ok: boolean }>(`/api/visitors/${id}`);
}

export function getStats(linkId?: number) {
  return api.get<Stats>(linkId ? `/api/stats/link/${linkId}` : '/api/stats');
}

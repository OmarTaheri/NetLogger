import { api } from './client';
import type { Visitor, Stats, AuditLog } from 'shared/types';

export interface VisitorParams {
  linkId?: number;
  limit?: number;
  offset?: number;
  since?: string;
  ip?: string;
  country?: string;
  browser?: string;
  os?: string;
  gpsGranted?: boolean;
  vpnDetected?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getVisitors(params?: VisitorParams) {
  const q = new URLSearchParams();
  if (params?.linkId) q.set('linkId', String(params.linkId));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  if (params?.since) q.set('since', params.since);
  if (params?.ip) q.set('ip', params.ip);
  if (params?.country) q.set('country', params.country);
  if (params?.browser) q.set('browser', params.browser);
  if (params?.os) q.set('os', params.os);
  if (params?.gpsGranted !== undefined) q.set('gpsGranted', String(params.gpsGranted));
  if (params?.vpnDetected !== undefined) q.set('vpnDetected', String(params.vpnDetected));
  if (params?.search) q.set('search', params.search);
  if (params?.sortBy) q.set('sortBy', params.sortBy);
  if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
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

export function bulkDeleteVisitors(data: { ids?: number[]; linkId?: number; olderThan?: string }) {
  return api.post<{ ok: boolean; deleted: number }>('/api/visitors/bulk-delete', data);
}

export function getStats(linkId?: number) {
  return api.get<Stats>(linkId ? `/api/stats/link/${linkId}` : '/api/stats');
}

export function getAuditLogs(limit = 100, offset = 0) {
  return api.get<AuditLog[]>(`/api/visitors/audit?limit=${limit}&offset=${offset}`);
}

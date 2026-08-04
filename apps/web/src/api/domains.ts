import { api } from './client';
import type { Domain } from '@netlogger/shared/types';

export function getDomains() {
  return api.get<Domain[]>('/api/domains');
}

export function createDomain(domain: string) {
  return api.post<Domain>('/api/domains', { domain });
}

export function updateDomain(id: number, data: { domain?: string; isActive?: boolean }) {
  return api.patch<Domain>(`/api/domains/${id}`, data);
}

export function verifyDomain(id: number) {
  return api.post<Domain>(`/api/domains/${id}/verify`, {});
}

export function deleteDomain(id: number) {
  return api.delete<{ ok: boolean }>(`/api/domains/${id}`);
}

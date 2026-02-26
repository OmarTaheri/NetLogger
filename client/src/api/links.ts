import { api } from './client';
import type { Link, CreateLinkInput } from 'shared/types';

type LinkWithUrl = Link & { trackingUrl: string };

export function getLinks() {
  return api.get<LinkWithUrl[]>('/api/links');
}

export function getLink(id: number) {
  return api.get<LinkWithUrl>(`/api/links/${id}`);
}

export function createLink(input: CreateLinkInput) {
  return api.post<LinkWithUrl>('/api/links', input);
}

export function updateLink(id: number, data: { title?: string; isActive?: boolean; templateOptions?: object; gpsMode?: string; domainId?: number | null }) {
  return api.patch<LinkWithUrl>(`/api/links/${id}`, data);
}

export function deleteLink(id: number) {
  return api.delete<{ ok: boolean }>(`/api/links/${id}`);
}

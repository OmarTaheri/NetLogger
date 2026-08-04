import { api, ApiError } from './client';

export type GuestTemplateId = 'redirect' | 'captcha';

export interface GuestLinkConfig {
  defaultDomain: string;
  templates: { id: GuestTemplateId; name: string; description: string }[];
  lockedTemplates: string[];
  limits: {
    lifetimeHours: number;
    maxVisits: number;
    customDomains: boolean;
    gpsModes: ('optional' | 'disabled')[];
  };
}

export interface GuestLinkCreateInput {
  targetUrl: string;
  templateId: GuestTemplateId;
  title?: string;
  templateOptions?: Record<string, string>;
  gpsMode: 'optional' | 'disabled';
  domainChoice: 'default';
}

export interface GuestLinkCreated {
  slug: string;
  title: string | null;
  templateId: GuestTemplateId;
  trackingUrl: string;
  resultsUrl: string;
  resultsToken: string;
  expiresAt: string;
  maxVisits: number;
  visitCount: number;
}

export interface GuestLinkResults {
  link: {
    slug: string;
    title: string | null;
    templateId: GuestTemplateId;
    trackingUrl: string;
    visitCount: number;
    expiresAt: string;
    maxVisits: number;
    isActive: boolean;
  };
  recentVisitors: {
    id: number;
    createdAt: string;
    ipCity: string | null;
    ipCountry: string | null;
    browser: string | null;
    os: string | null;
    deviceTier: string | null;
    humanScore: number | null;
    vpnDetected: boolean | null;
  }[];
  limitations: {
    visitorDetails: string;
    historyLimit: number;
    upgradeFeatures: string[];
  };
}

export function getGuestLinkConfig() {
  return api.get<GuestLinkConfig>('/api/public/links/config');
}

export function createGuestLink(input: GuestLinkCreateInput) {
  return api.post<GuestLinkCreated>('/api/public/links', input);
}

export async function getGuestLinkResults(slug: string, token: string) {
  const response = await fetch(`/api/public/links/${encodeURIComponent(slug)}/results`, {
    credentials: 'include',
    headers: { 'x-guest-token': token },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Guest results unavailable' }));
    throw new ApiError(body.error || 'Guest results unavailable', response.status);
  }
  return response.json() as Promise<GuestLinkResults>;
}

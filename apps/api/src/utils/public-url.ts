import type { Request } from 'express';
import { config } from '../config.js';

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  return url.origin;
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return localHosts.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local');
  } catch {
    return true;
  }
}

function forwardedValue(value: string | undefined) {
  return value?.split(',')[0]?.trim();
}

/**
 * Returns the configured public URL, or, in a production proxy deployment with
 * a local default, the request's public origin. This keeps generated links from
 * leaking an internal localhost port when BASE_URL has not been configured.
 */
export function getPublicBaseUrl(req?: Request) {
  const configured = normalizeBaseUrl(config.baseUrl);
  if (!isLocalUrl(configured) || !req) return configured;

  const host = forwardedValue(req.get('x-forwarded-host')) || req.get('host');
  const protocol = forwardedValue(req.get('x-forwarded-proto')) || req.protocol;
  if (!host || !/^[a-zA-Z0-9.:[\]-]+$/.test(host) || !['http', 'https'].includes(protocol)) return configured;

  try {
    const requestUrl = new URL(`${protocol}://${host}`);
    return isLocalUrl(requestUrl.origin) ? configured : requestUrl.origin;
  } catch {
    return configured;
  }
}

export function getConfiguredPublicBaseUrl() {
  const configured = normalizeBaseUrl(config.baseUrl);
  return isLocalUrl(configured) ? null : configured;
}

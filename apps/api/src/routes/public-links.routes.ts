import { isIP } from 'node:net';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as guestLinkService from '../services/guest-link.service.js';
import { getValidationError } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicBaseUrl } from '../utils/public-url.js';

const router = Router();

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Guest link limit reached. Create an account for higher limits.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resultsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  message: { error: 'Too many result checks. Try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const guestCreateSchema = z.object({
  targetUrl: z.string().url('Enter a valid destination URL').max(2048),
  templateId: z.enum(['redirect', 'captcha']),
  title: z.string().trim().max(80).optional(),
  templateOptions: z.record(z.string(), z.unknown()).optional(),
  gpsMode: z.enum(['optional', 'disabled']).default('optional'),
  domainChoice: z.literal('default').default('default'),
});

function safePublicTarget(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:') return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return false;
  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const [a, b] = hostname.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return false;
  }
  if (ipVersion === 6 && (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe8'))) return false;
  return true;
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : undefined;
}

function sanitizeOptions(templateId: 'redirect' | 'captcha', raw?: Record<string, unknown>) {
  if (!raw) return undefined;
  if (templateId === 'redirect') {
    return {
      loadingMessage: cleanText(raw.loadingMessage, 80),
      subMessage: cleanText(raw.subMessage, 120),
    };
  }
  return {
    siteTitle: cleanText(raw.siteTitle, 70),
    message: cleanText(raw.message, 150),
  };
}

router.get('/config', (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  res.json({
    defaultDomain: new URL(baseUrl).host,
    templates: [
      { id: 'redirect', name: 'Signal Redirect', description: 'A clean branded transition before the destination opens.' },
      { id: 'captcha', name: 'Human Check', description: 'A lightweight verification step before continuing.' },
    ],
    lockedTemplates: ['Google Drive', 'Dropbox', 'WeTransfer'],
    limits: {
      lifetimeHours: guestLinkService.GUEST_LINK_LIFETIME_HOURS,
      maxVisits: guestLinkService.GUEST_LINK_MAX_VISITS,
      customDomains: false,
      gpsModes: ['optional', 'disabled'],
    },
  });
});

router.post('/', createLimiter, asyncHandler(async (req, res) => {
  const parsed = guestCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  if (!safePublicTarget(parsed.data.targetUrl)) {
    res.status(400).json({ error: 'Guest links require a public HTTPS destination.' });
    return;
  }

  const result = await guestLinkService.createGuestLink({
    targetUrl: parsed.data.targetUrl,
    templateId: parsed.data.templateId,
    title: parsed.data.title || undefined,
    templateOptions: sanitizeOptions(parsed.data.templateId, parsed.data.templateOptions),
    gpsMode: parsed.data.gpsMode,
  }, getPublicBaseUrl(req));
  res.status(201).json(result);
}));

router.get('/:slug/results', resultsLimiter, asyncHandler(async (req, res) => {
  const token = req.get('x-guest-token') || '';
  const result = await guestLinkService.getGuestLinkResults(req.params.slug as string, token, getPublicBaseUrl(req));
  if (!result) {
    res.status(404).json({ error: 'Guest results not found' });
    return;
  }
  res.json(result);
}));

export default router;

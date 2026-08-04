import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as linkService from '../services/link.service.js';
import * as visitorService from '../services/visitor.service.js';
import { lookupIp } from '../services/geoip.service.js';
import { analyzeVisitor } from '../services/analysis.service.js';
import { wsManager } from '../realtime/index.js';
import { getClientIp } from '../utils/ip.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fireWebhooks } from '../services/webhook.service.js';

const collectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { ok: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/:slug', collectLimiter, asyncHandler(async (req, res) => {
  const slug = req.params.slug as string;
  const link = await linkService.getLinkBySlug(slug);

  if (!link || !link.isActive) {
    res.status(404).json({ ok: false });
    return;
  }

  // Check expiration
  if (linkService.isLinkExpired(link)) {
    res.status(410).json({ ok: false, error: 'Link expired' });
    return;
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const body = req.body || {};

  const geoip = await lookupIp(ip);
  const visitorData = visitorService.buildVisitorFromRequest(body, link.id, ip, userAgent, geoip);

  // Run analysis before insert so we can do a single write
  const analysis = await analyzeVisitor(visitorData, link.userId);
  Object.assign(visitorData, analysis);

  const visitor = await visitorService.createVisitor(visitorData);

  await linkService.incrementVisitCount(link.id);

  const visitorWithLink = { ...visitor, linkSlug: link.slug, linkTitle: link.title };

  wsManager.broadcastToUser(link.userId, {
    type: 'new_visitor',
    data: visitorWithLink,
  });

  // Fire webhooks asynchronously
  fireWebhooks(link.userId, 'new_visitor', visitorWithLink).catch(() => {});
  if (visitor.botScore !== null && visitor.botScore >= 80) {
    fireWebhooks(link.userId, 'high_risk_visitor', visitorWithLink).catch(() => {});
  }

  res.json({ ok: true });
}));

export default router;

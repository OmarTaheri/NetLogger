import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as linkService from '../services/link.service.js';
import * as visitorService from '../services/visitor.service.js';
import { lookupIp } from '../services/geoip.service.js';
import { analyzeVisitor } from '../services/analysis.service.js';
import { wsManager } from '../ws/index.js';
import { getClientIp } from '../utils/ip.js';

const collectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { ok: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/:slug', collectLimiter, async (req, res) => {
  const slug = req.params.slug as string;
  const link = linkService.getLinkBySlug(slug);

  if (!link || !link.isActive) {
    res.status(404).json({ ok: false });
    return;
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const body = req.body || {};

  const geoip = await lookupIp(ip);
  const visitorData = visitorService.buildVisitorFromRequest(body, link.id, ip, userAgent, geoip);

  // Run analysis before insert so we can do a single write
  const analysis = analyzeVisitor(visitorData);
  Object.assign(visitorData, analysis);

  const visitor = visitorService.createVisitor(visitorData);

  linkService.incrementVisitCount(link.id);

  wsManager.broadcast({
    type: 'new_visitor',
    data: { ...visitor, linkSlug: link.slug, linkTitle: link.title },
  });

  res.json({ ok: true });
});

export default router;

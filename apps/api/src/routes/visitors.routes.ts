import { Router } from 'express';
import { userMiddleware, AuthRequest } from '../middleware/auth.js';
import * as visitorService from '../services/visitor.service.js';
import * as linkService from '../services/link.service.js';
import * as auditService from '../services/audit.service.js';
import { bulkDeleteSchema, getValidationError } from '../utils/validation.js';
import type { VisitorFilters } from '../services/visitor.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(userMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const filters: VisitorFilters = {
    linkId: req.query.linkId ? parseInt(req.query.linkId as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    since: req.query.since ? (req.query.since as string) : undefined,
    ip: req.query.ip as string | undefined,
    country: req.query.country as string | undefined,
    browser: req.query.browser as string | undefined,
    os: req.query.os as string | undefined,
    gpsGranted: req.query.gpsGranted !== undefined ? req.query.gpsGranted === 'true' : undefined,
    botScoreMin: req.query.botScoreMin ? parseInt(req.query.botScoreMin as string) : undefined,
    botScoreMax: req.query.botScoreMax ? parseInt(req.query.botScoreMax as string) : undefined,
    vpnDetected: req.query.vpnDetected !== undefined ? req.query.vpnDetected === 'true' : undefined,
    search: req.query.search as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const [visitors, total] = await Promise.all([
    visitorService.getVisitors(req.userId!, filters),
    visitorService.getVisitorCount(req.userId!, filters),
  ]);
  res.json({ visitors, total });
}));

router.get('/audit', asyncHandler(async (_req: AuthRequest, res) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string) : 100;
  const offset = _req.query.offset ? parseInt(_req.query.offset as string) : 0;
  const logs = await auditService.getAuditLogs(_req.userId!, limit, offset);
  res.json(logs);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const visitor = await visitorService.getVisitorById(req.userId!, parseInt(req.params.id as string));
  if (!visitor) {
    res.status(404).json({ error: 'Visitor not found' });
    return;
  }
  res.json(visitor);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const deleted = await visitorService.deleteVisitor(req.userId!, id);
  if (!deleted) {
    res.status(404).json({ error: 'Visitor not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'visitor.delete', 'visitor', id);
  res.json({ ok: true });
}));

router.post('/bulk-delete', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = bulkDeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const { ids, linkId, olderThan } = parsed.data;
  let deleted = 0;

  if (ids && ids.length > 0) {
    if ((await Promise.all(ids.map((id) => visitorService.getVisitorById(req.userId!, id)))).some((visitor) => !visitor)) {
      res.status(404).json({ error: 'Visitor not found' });
      return;
    }
    deleted = await visitorService.deleteVisitorsByIds(req.userId!, ids);
  } else if (linkId) {
    if (!(await linkService.getLinkById(req.userId!, linkId))) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }
    deleted = await visitorService.deleteVisitorsByLinkId(req.userId!, linkId);
  } else if (olderThan) {
    deleted = await visitorService.deleteVisitorsOlderThan(req.userId!, olderThan);
  } else {
    res.status(400).json({ error: 'Provide ids, linkId, or olderThan' });
    return;
  }

  await auditService.logAction(req.userId!, 'visitor.bulk_delete', 'visitor', undefined, { deleted, ids, linkId, olderThan });
  res.json({ ok: true, deleted });
}));

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as visitorService from '../services/visitor.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const since = req.query.since ? (req.query.since as string) : undefined;

  const visitors = visitorService.getVisitors({ linkId, limit, offset, since });
  const total = visitorService.getVisitorCount(linkId, since);
  res.json({ visitors, total });
});

router.get('/:id', (req, res) => {
  const visitor = visitorService.getVisitorById(parseInt(req.params.id));
  if (!visitor) {
    res.status(404).json({ error: 'Visitor not found' });
    return;
  }
  res.json(visitor);
});

router.delete('/:id', (req, res) => {
  visitorService.deleteVisitor(parseInt(req.params.id));
  res.json({ ok: true });
});

export default router;

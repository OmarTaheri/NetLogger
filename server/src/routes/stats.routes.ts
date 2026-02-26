import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as statsService from '../services/stats.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  res.json(statsService.getStats());
});

router.get('/link/:id', (req, res) => {
  res.json(statsService.getStats(parseInt(req.params.id)));
});

export default router;

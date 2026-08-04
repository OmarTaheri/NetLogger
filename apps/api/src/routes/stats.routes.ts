import { Router } from 'express';
import { userMiddleware, type AuthRequest } from '../middleware/auth.js';
import * as statsService from '../services/stats.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(userMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  res.json(await statsService.getStats(req.userId!));
}));

router.get('/link/:id', asyncHandler(async (req: AuthRequest, res) => {
  const stats = await statsService.getStats(req.userId!, parseInt(req.params.id as string));
  if (!stats) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json(stats);
}));

export default router;

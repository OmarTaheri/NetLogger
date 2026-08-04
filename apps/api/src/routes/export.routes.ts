import { Router } from 'express';
import { userMiddleware, type AuthRequest } from '../middleware/auth.js';
import { getVisitorsForExport, toCsv } from '../services/export.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(userMiddleware);

router.get('/visitors/export', asyncHandler(async (req: AuthRequest, res) => {
  const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
  const rows = await getVisitorsForExport(req.userId!, linkId);
  const csv = toCsv(rows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="visitors.csv"');
  res.send(csv);
}));

export default router;

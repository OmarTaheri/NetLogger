import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getVisitorsForExport, toCsv } from '../services/export.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/visitors/export', (req, res) => {
  const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
  const rows = getVisitorsForExport(linkId);
  const csv = toCsv(rows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="visitors.csv"');
  res.send(csv);
});

export default router;

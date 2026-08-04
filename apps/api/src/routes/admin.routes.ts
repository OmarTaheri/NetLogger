import { Router } from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import * as adminService from '../services/admin.service.js';

const router = Router();
router.use(adminMiddleware);

router.get('/overview', async (_req, res) => {
  res.json(await adminService.getAdminOverview());
});

router.get('/users', async (_req, res) => {
  res.json(await adminService.getAdminUsers());
});

export default router;

import { Router } from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import * as adminService from '../services/admin.service.js';
import { getPublicBaseUrl } from '../utils/public-url.js';

const router = Router();
router.use(adminMiddleware);

router.get('/overview', async (_req, res) => {
  res.json(await adminService.getAdminOverview());
});

router.get('/users', async (_req, res) => {
  res.json(await adminService.getAdminUsers());
});

router.get('/domains', async (req, res) => {
  res.json({
    defaultDomain: new URL(getPublicBaseUrl(req)).host,
    domains: await adminService.getAdminDomains(),
  });
});

export default router;

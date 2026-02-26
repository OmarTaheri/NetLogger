import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as domainService from '../services/domain.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const domains = domainService.getAllDomains();
  res.json(domains);
});

router.post('/', (req, res) => {
  const { domain } = req.body;
  if (!domain) {
    res.status(400).json({ error: 'domain is required' });
    return;
  }

  // Basic validation: strip protocol if user pastes a full URL
  let cleanDomain = domain.trim();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  cleanDomain = cleanDomain.replace(/\/+$/, '');

  if (!cleanDomain) {
    res.status(400).json({ error: 'Invalid domain' });
    return;
  }

  try {
    const result = domainService.createDomain(cleanDomain);
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Domain already exists' });
      return;
    }
    throw err;
  }
});

router.patch('/:id', (req, res) => {
  const { domain, isActive } = req.body;
  const updateData: Record<string, any> = {};
  if (domain !== undefined) updateData.domain = domain;
  if (isActive !== undefined) updateData.isActive = isActive;

  const result = domainService.updateDomain(parseInt(req.params.id), updateData);
  if (!result) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  res.json(result);
});

router.delete('/:id', (req, res) => {
  domainService.deleteDomain(parseInt(req.params.id));
  res.json({ ok: true });
});

export default router;

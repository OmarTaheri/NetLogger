import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import * as domainService from '../services/domain.service.js';
import * as auditService from '../services/audit.service.js';
import { sanitizeDomain } from '../utils/domain.js';
import { createDomainSchema, getValidationError } from '../utils/validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const domains = domainService.getAllDomains();
  res.json(domains);
});

router.post('/', (req: AuthRequest, res) => {
  const parsed = createDomainSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const cleanDomain = sanitizeDomain(parsed.data.domain);

  if (!cleanDomain) {
    res.status(400).json({ error: 'Invalid domain' });
    return;
  }

  try {
    const result = domainService.createDomain(cleanDomain);
    auditService.logAction(req.adminId!, 'domain.create', 'domain', result.id, { domain: cleanDomain });
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Domain already exists' });
      return;
    }
    throw err;
  }
});

router.patch('/:id', (req: AuthRequest, res) => {
  const { domain, isActive } = req.body;
  const updateData: Record<string, any> = {};
  if (domain !== undefined) updateData.domain = domain;
  if (isActive !== undefined) updateData.isActive = isActive;

  const result = domainService.updateDomain(parseInt(req.params.id as string), updateData);
  if (!result) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  auditService.logAction(req.adminId!, 'domain.update', 'domain', result.id);
  res.json(result);
});

router.delete('/:id', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  domainService.deleteDomain(id);
  auditService.logAction(req.adminId!, 'domain.delete', 'domain', id);
  res.json({ ok: true });
});

export default router;

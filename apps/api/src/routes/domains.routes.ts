import { Router } from 'express';
import { userMiddleware, AuthRequest } from '../middleware/auth.js';
import * as domainService from '../services/domain.service.js';
import * as auditService from '../services/audit.service.js';
import { sanitizeDomain } from '../utils/domain.js';
import { createDomainSchema, getValidationError } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(userMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const domains = await domainService.getAllDomains(req.userId!);
  res.json(domains);
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
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
    const result = await domainService.createDomain(req.userId!, cleanDomain);
    await auditService.logAction(req.userId!, 'domain.create', 'domain', result.id, { domain: cleanDomain });
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Domain already exists' });
      return;
    }
    throw err;
  }
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { domain, isActive } = req.body;
  const updateData: Record<string, any> = {};
  if (domain !== undefined) updateData.domain = sanitizeDomain(domain);
  if (isActive !== undefined) updateData.isActive = isActive;

  const result = await domainService.updateDomain(req.userId!, parseInt(req.params.id as string), updateData);
  if (!result) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'domain.update', 'domain', result.id);
  res.json(result);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const deleted = await domainService.deleteDomain(req.userId!, id);
  if (!deleted) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'domain.delete', 'domain', id);
  res.json({ ok: true });
}));

export default router;

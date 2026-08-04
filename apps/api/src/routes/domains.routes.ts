import { Router } from 'express';
import { userMiddleware, AuthRequest } from '../middleware/auth.js';
import * as domainService from '../services/domain.service.js';
import * as auditService from '../services/audit.service.js';
import { sanitizeDomain } from '../utils/domain.js';
import { createDomainSchema, getValidationError } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDomainVerificationInstructions } from '../services/domain-verification.service.js';

const router = Router();
router.use(userMiddleware);

function serializeDomain(domain: Awaited<ReturnType<typeof domainService.getDomainById>>) {
  if (!domain) return domain;
  return { ...domain, verification: getDomainVerificationInstructions(domain.domain, domain.verificationToken) };
}

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const domains = await domainService.getAllDomains(req.userId!);
  res.json(domains.map((domain) => serializeDomain(domain)));
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
    res.json(serializeDomain(result));
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
  const id = parseInt(req.params.id as string);
  const current = await domainService.getDomainById(id, req.userId!);
  if (!current) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  if (domain !== undefined) {
    res.status(400).json({ error: 'Create a new domain instead of changing a verified domain.' });
    return;
  }
  if (isActive === true && current.verificationStatus !== 'verified') {
    res.status(400).json({ error: 'Verify this domain before activating it.' });
    return;
  }
  const updateData: Record<string, any> = {};
  if (isActive !== undefined) updateData.isActive = isActive;

  const result = await domainService.updateDomain(req.userId!, id, updateData);
  await auditService.logAction(req.userId!, 'domain.update', 'domain', result.id);
  res.json(serializeDomain(result));
}));

router.post('/:id/verify', asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const result = await domainService.verifyDomain(req.userId!, id);
  if (!result) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  await auditService.logAction(req.userId!, result.isActive ? 'domain.verify' : 'domain.verify_failed', 'domain', result.id, { status: result.verificationStatus });
  res.json(serializeDomain(result));
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

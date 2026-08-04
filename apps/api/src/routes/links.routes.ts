import { Router } from 'express';
import { userMiddleware, AuthRequest } from '../middleware/auth.js';
import * as linkService from '../services/link.service.js';
import * as domainService from '../services/domain.service.js';
import * as auditService from '../services/audit.service.js';
import { createLinkSchema, updateLinkSchema, getValidationError } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicBaseUrl } from '../utils/public-url.js';

const router = Router();
router.use(userMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const links = await linkService.getAllLinks(req.userId!);
  const linksWithUrl = await Promise.all(links.map(async (link) => ({
    ...link,
    trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
  })));
  res.json(linksWithUrl);
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const parsed = createLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const { targetUrl, templateId, title, templateOptions, gpsMode, domainId, expiresAt, maxVisits } = parsed.data;

  if (domainId && !(await domainService.getDomainById(domainId, req.userId!))) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  const link = await linkService.createLink(req.userId!, targetUrl, templateId, title, templateOptions, gpsMode, domainId ?? undefined, expiresAt, maxVisits);
  await auditService.logAction(req.userId!, 'link.create', 'link', link.id, { slug: link.slug });
  res.json({
    ...link,
    trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const link = await linkService.getLinkById(req.userId!, parseInt(req.params.id as string));
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json({
    ...link,
    trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
  });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const parsed = updateLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const updateData: Record<string, any> = {};
  const { title, isActive, templateOptions, gpsMode, domainId, expiresAt, maxVisits } = parsed.data;
  if (title !== undefined) updateData.title = title;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (templateOptions !== undefined) updateData.templateOptions = JSON.stringify(templateOptions);
  if (gpsMode !== undefined) updateData.gpsMode = gpsMode;
  if (domainId !== undefined) updateData.domainId = domainId;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
  if (maxVisits !== undefined) updateData.maxVisits = maxVisits;

  if (domainId && !(await domainService.getDomainById(domainId, req.userId!))) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }
  const link = await linkService.updateLink(req.userId!, parseInt(req.params.id as string), updateData);
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'link.update', 'link', link.id);
  res.json({
    ...link,
    trackingUrl: await linkService.getTrackingUrl(link, baseUrl),
  });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const deleted = await linkService.deleteLink(req.userId!, id);
  if (!deleted) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'link.delete', 'link', id);
  res.json({ ok: true });
}));

export default router;

import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import * as linkService from '../services/link.service.js';
import * as auditService from '../services/audit.service.js';
import { createLinkSchema, updateLinkSchema, getValidationError } from '../utils/validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const links = linkService.getAllLinks();
  const linksWithUrl = links.map(link => ({
    ...link,
    trackingUrl: linkService.getTrackingUrl(link),
  }));
  res.json(linksWithUrl);
});

router.post('/', (req: AuthRequest, res) => {
  const parsed = createLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const { targetUrl, templateId, title, templateOptions, gpsMode, domainId, expiresAt, maxVisits } = parsed.data;

  const link = linkService.createLink(targetUrl, templateId, title, templateOptions, gpsMode, domainId ?? undefined, expiresAt, maxVisits);
  auditService.logAction(req.adminId!, 'link.create', 'link', link.id, { slug: link.slug });
  res.json({
    ...link,
    trackingUrl: linkService.getTrackingUrl(link),
  });
});

router.get('/:id', (req, res) => {
  const link = linkService.getLinkById(parseInt(req.params.id as string));
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json({
    ...link,
    trackingUrl: linkService.getTrackingUrl(link),
  });
});

router.patch('/:id', (req: AuthRequest, res) => {
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

  const link = linkService.updateLink(parseInt(req.params.id as string), updateData);
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  auditService.logAction(req.adminId!, 'link.update', 'link', link.id);
  res.json({
    ...link,
    trackingUrl: linkService.getTrackingUrl(link),
  });
});

router.delete('/:id', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  linkService.deleteLink(id);
  auditService.logAction(req.adminId!, 'link.delete', 'link', id);
  res.json({ ok: true });
});

export default router;

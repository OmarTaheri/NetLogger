import { Router } from 'express';
import * as linkService from '../services/link.service.js';
import { renderRedirectTemplate } from '../templates/redirect.js';
import { renderGdriveTemplate } from '../templates/gdrive.js';

const router = Router();

router.get('/:templateId/:slug', (req, res) => {
  const { templateId, slug } = req.params;
  const link = linkService.getLinkBySlug(slug);

  if (!link || !link.isActive) {
    res.status(404).send('<h1>404 - Not Found</h1>');
    return;
  }

  if (link.templateId !== templateId) {
    res.status(404).send('<h1>404 - Not Found</h1>');
    return;
  }

  const options = link.templateOptions ? JSON.parse(link.templateOptions) : {};
  const gpsMode = link.gpsMode || 'optional';

  let html: string;
  switch (templateId) {
    case 'redirect':
      html = renderRedirectTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    case 'gdrive':
      html = renderGdriveTemplate(slug, link.targetUrl, options, gpsMode);
      break;
    default:
      res.status(404).send('<h1>404 - Unknown template</h1>');
      return;
  }

  res.type('html').send(html);
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { renderCaptchaTemplate } from '../tracking-templates/captcha.js';
import { renderDropboxTemplate } from '../tracking-templates/dropbox.js';
import { renderGoogleDriveTemplate } from '../tracking-templates/google-drive.js';
import { renderRedirectTemplate } from '../tracking-templates/redirect.js';
import { renderWeTransferTemplate } from '../tracking-templates/we-transfer.js';
import { getValidationError } from '../utils/validation.js';

const router = Router();

const previewSchema = z.object({
  templateId: z.enum(['redirect', 'gdrive', 'dropbox', 'captcha', 'wetransfer']),
  templateOptions: z.record(z.string(), z.unknown()).optional(),
});

const PREVIEW_SLUG = 'template-preview';
const PREVIEW_TARGET_URL = 'https://example.com/preview';

/**
 * Previews intentionally use the exact same document renderer as a deployed
 * tracking link. Removing scripts keeps a preview passive: it cannot collect
 * data, request location, redirect, or follow template button actions.
 */
function stripScripts(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

router.post('/', (req, res) => {
  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError({ success: false, error: parsed.error }) });
    return;
  }

  const { templateId, templateOptions = {} } = parsed.data;
  let html: string;

  switch (templateId) {
    case 'redirect':
      html = renderRedirectTemplate(PREVIEW_SLUG, PREVIEW_TARGET_URL, templateOptions);
      break;
    case 'gdrive':
      html = renderGoogleDriveTemplate(PREVIEW_SLUG, PREVIEW_TARGET_URL, templateOptions);
      break;
    case 'dropbox':
      html = renderDropboxTemplate(PREVIEW_SLUG, PREVIEW_TARGET_URL, templateOptions);
      break;
    case 'captcha':
      html = renderCaptchaTemplate(PREVIEW_SLUG, PREVIEW_TARGET_URL, templateOptions);
      break;
    case 'wetransfer':
      html = renderWeTransferTemplate(PREVIEW_SLUG, PREVIEW_TARGET_URL, templateOptions);
      break;
  }

  res.json({ html: stripScripts(html) });
});

export default router;

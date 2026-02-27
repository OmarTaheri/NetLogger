import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import * as webhookService from '../services/webhook.service.js';
import * as auditService from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createWebhookSchema, updateWebhookSchema, getValidationError } from '../utils/validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const webhooks = webhookService.getAllWebhooks();
  res.json(webhooks);
});

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  const { url, events, secret } = parsed.data;
  const webhook = webhookService.createWebhook(url, events, secret);
  auditService.logAction(req.adminId!, 'webhook.create', 'webhook', webhook.id);
  res.json(webhook);
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = updateWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  const webhook = webhookService.updateWebhook(parseInt(req.params.id as string), parsed.data);
  if (!webhook) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  auditService.logAction(req.adminId!, 'webhook.update', 'webhook', webhook.id);
  res.json(webhook);
}));

router.delete('/:id', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  webhookService.deleteWebhook(id);
  auditService.logAction(req.adminId!, 'webhook.delete', 'webhook', id);
  res.json({ ok: true });
});

export default router;

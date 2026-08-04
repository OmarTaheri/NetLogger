import { Router } from 'express';
import { userMiddleware, AuthRequest } from '../middleware/auth.js';
import * as webhookService from '../services/webhook.service.js';
import * as auditService from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createWebhookSchema, updateWebhookSchema, getValidationError } from '../utils/validation.js';

const router = Router();
router.use(userMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const webhooks = await webhookService.getAllWebhooks(req.userId!);
  res.json(webhooks);
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  const { url, events, secret } = parsed.data;
  const webhook = await webhookService.createWebhook(req.userId!, url, events, secret);
  await auditService.logAction(req.userId!, 'webhook.create', 'webhook', webhook.id);
  res.json(webhook);
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = updateWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  const webhook = await webhookService.updateWebhook(req.userId!, parseInt(req.params.id as string), parsed.data);
  if (!webhook) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'webhook.update', 'webhook', webhook.id);
  res.json(webhook);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const deleted = await webhookService.deleteWebhook(req.userId!, id);
  if (!deleted) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  await auditService.logAction(req.userId!, 'webhook.delete', 'webhook', id);
  res.json({ ok: true });
}));

export default router;

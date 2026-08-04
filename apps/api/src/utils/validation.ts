import { z } from 'zod';

export const VALID_TEMPLATE_IDS = ['redirect', 'gdrive', 'dropbox', 'captcha', 'wetransfer'] as const;
export const VALID_GPS_MODES = ['required', 'optional', 'disabled'] as const;

export const createLinkSchema = z.object({
  targetUrl: z.string().url('Invalid URL'),
  templateId: z.enum(VALID_TEMPLATE_IDS),
  title: z.string().max(200).optional(),
  templateOptions: z.record(z.string(), z.unknown()).optional(),
  gpsMode: z.enum(VALID_GPS_MODES).default('optional'),
  domainId: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  maxVisits: z.number().int().positive().optional().nullable(),
});

export const updateLinkSchema = z.object({
  title: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  templateOptions: z.record(z.string(), z.unknown()).optional(),
  gpsMode: z.enum(VALID_GPS_MODES).optional(),
  domainId: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  maxVisits: z.number().int().positive().optional().nullable(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes');

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: passwordSchema,
});

export const googleCredentialSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const createDomainSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).optional(),
  linkId: z.number().int().positive().optional(),
  olderThan: z.string().optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().optional(),
});

export const updateWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL').optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function getValidationError(result: { success: false; error: z.ZodError }): string {
  return result.error.issues[0]?.message || 'Validation failed';
}

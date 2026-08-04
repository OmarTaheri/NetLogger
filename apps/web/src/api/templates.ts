import type { TemplateId } from '@netlogger/shared/types';
import { api } from './client';

export function getTemplatePreview(templateId: TemplateId, templateOptions: Record<string, string>) {
  return api.post<{ html: string }>('/api/templates/preview', { templateId, templateOptions });
}

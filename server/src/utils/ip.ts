import type { Request } from 'express';

export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.headers['cf-connecting-ip'] as string
    || req.socket.remoteAddress
    || '';
}

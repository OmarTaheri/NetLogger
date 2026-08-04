import { Request, Response, NextFunction } from 'express';
import { SESSION_COOKIE, verifyToken, type PublicUser, toPublicUser } from '../services/auth.service.js';

export interface AuthRequest extends Request {
  userId?: number;
  user?: PublicUser;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await verifyToken(token);
    if (!user) throw new Error('Invalid session');
    req.userId = user.id;
    req.user = toPublicUser(user);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Administrator access required' });
      return;
    }
    next();
  });
}

export function userMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'user') {
      res.status(403).json({ error: 'This area is available to standard user accounts only' });
      return;
    }
    next();
  });
}

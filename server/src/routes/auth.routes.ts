import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authService from '../services/auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const admin = authService.getAdminByUsername(username);
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await authService.verifyPassword(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = authService.createToken(admin);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ id: admin.id, username: admin.username });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const admin = authService.getAdminById(req.adminId!);

  if (!admin) {
    res.status(401).json({ error: 'Not found' });
    return;
  }

  res.json(admin);
});

export default router;

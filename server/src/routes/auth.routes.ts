import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, changePasswordSchema, getValidationError } from '../utils/validation.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const { username, password } = parsed.data;
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

  auditService.logAction(admin.id, 'auth.login');
  res.json({ id: admin.id, username: admin.username });
}));

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

router.patch('/password', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;
  const admin = authService.getAdminByIdWithHash(req.adminId!);
  if (!admin) {
    res.status(401).json({ error: 'Not found' });
    return;
  }

  const valid = await authService.verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  await authService.updatePassword(admin.id, newPassword);
  auditService.logAction(admin.id, 'auth.password_change');
  res.json({ ok: true });
}));

export default router;

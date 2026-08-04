import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import { authMiddleware, userMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  loginSchema,
  adminLoginSchema,
  registerSchema,
  googleCredentialSchema,
  changePasswordSchema,
  getValidationError,
} from '../utils/validation.js';
import { config } from '../config.js';

const router = Router();
const fifteenMinutes = 15 * 60 * 1000;

const loginLimiter = rateLimit({ windowMs: fifteenMinutes, max: 10, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false });
const googleLimiter = rateLimit({ windowMs: fifteenMinutes, max: 20, standardHeaders: true, legacyHeaders: false });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function setSession(res: Response, user: { id: number; tokenVersion: number }) {
  res.cookie(authService.SESSION_COOKIE, authService.createToken(user), {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.get('/config', (_req, res) => {
  res.json({
    googleEnabled: Boolean(config.googleClientId),
    googleClientId: config.googleClientId || null,
    demoAccounts: config.showDemoAccounts ? [
      {
        label: config.defaultUserDisplayName,
        email: config.defaultUserEmail,
        password: config.defaultUserPassword,
        role: 'user',
      },
      {
        label: 'Administrator',
        email: config.adminEmail,
        password: config.adminPassword,
        role: 'admin',
      },
    ] : [],
  });
});

router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  try {
    const user = await authService.registerUser(parsed.data.displayName, parsed.data.email, parsed.data.password);
    if (!user) {
      res.status(409).json({ error: 'An account with that email already exists', code: 'EMAIL_EXISTS' });
      return;
    }
    setSession(res, user);
    await auditService.logAction(user.id, 'auth.register');
    res.status(201).json(authService.toPublicUser(user));
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'An account with that email already exists', code: 'EMAIL_EXISTS' });
      return;
    }
    throw error;
  }
}));

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const candidate = { ...req.body, identifier: req.body?.identifier ?? req.body?.username };
  const parsed = loginSchema.safeParse(candidate);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const user = await authService.getUserByIdentifier(parsed.data.identifier);
  if (!user?.passwordHash || user.role !== 'user' || !(await authService.verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  setSession(res, user);
  await auditService.logAction(user.id, 'auth.login');
  res.json(authService.toPublicUser(user));
}));

router.post('/admin/login', loginLimiter, asyncHandler(async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const user = await authService.getAdminByEmail(parsed.data.email);
  if (!user?.passwordHash || !(await authService.verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid administrator credentials' });
    return;
  }

  setSession(res, user);
  await auditService.logAction(user.id, 'auth.admin_login');
  res.json(authService.toPublicUser(user));
}));

router.post('/google', googleLimiter, asyncHandler(async (req, res) => {
  const parsed = googleCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  if (!config.googleClientId) {
    res.status(503).json({ error: 'Google sign-in is not configured' });
    return;
  }

  try {
    const payload = await authService.verifyGoogleCredential(parsed.data.credential);
    if (!payload) {
      res.status(401).json({ error: 'Invalid Google credential' });
      return;
    }
    const result = await authService.signInWithGoogle(payload);
    if (result.linkRequired) {
      res.status(409).json({
        error: 'Sign in with your password, then connect Google from Settings',
        code: 'ACCOUNT_LINK_REQUIRED',
      });
      return;
    }
    if (result.user!.role !== 'user') {
      res.status(403).json({ error: 'Use administrator sign-in for this account' });
      return;
    }
    setSession(res, result.user!);
    await auditService.logAction(result.user!.id, 'auth.google_login');
    res.json(authService.toPublicUser(result.user!));
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
}));

router.post('/google/link', googleLimiter, userMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const parsed = googleCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }
  try {
    const payload = await authService.verifyGoogleCredential(parsed.data.credential);
    const user = payload && await authService.linkGoogleAccount(req.userId!, payload);
    if (!user) {
      res.status(409).json({ error: 'This Google account cannot be linked', code: 'GOOGLE_LINK_CONFLICT' });
      return;
    }
    await auditService.logAction(user.id, 'auth.google_link');
    res.json(authService.toPublicUser(user));
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
}));

router.post('/logout', (_req, res) => {
  res.clearCookie(authService.SESSION_COOKIE, cookieOptions);
  res.json({ ok: true });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json(req.user);
});

router.patch('/password', userMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getValidationError(parsed) });
    return;
  }

  const user = await authService.getUserById(req.userId!);
  if (!user?.passwordHash) {
    res.status(400).json({ error: 'This account does not use password sign-in' });
    return;
  }
  if (!(await authService.verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const updated = await authService.updatePassword(user.id, parsed.data.newPassword);
  setSession(res, updated);
  await auditService.logAction(user.id, 'auth.password_change');
  res.json({ ok: true });
}));

export default router;

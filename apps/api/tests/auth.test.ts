import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { initDb } from '../src/database/index.js';
import { db } from '../src/database/index.js';
import { users } from '../src/database/schema.js';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

// We need to create the app without starting the server
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await initDb();
  // Seed test admin
  const hash = await bcrypt.hash('testpass123!', 10);
  try {
    await db.insert(users).values({ username: 'testadmin', displayName: 'Test Admin', passwordHash: hash });
  } catch {
    // Already exists
  }
  app = createApp();
});

describe('Auth Routes', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GET /api/auth/config - exposes only the public Google client configuration', async () => {
    const res = await request(app).get('/api/auth/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      googleEnabled: true,
      googleClientId: 'test-google-client.apps.googleusercontent.com',
      demoAccounts: [],
    });
  });

  it('does not expose an email-and-password registration endpoint', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Signal Operator',
      email: 'operator@example.com',
      password: 'correct-horse-battery',
    });
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/login - should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testadmin', password: 'testpass123!' });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testadmin');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testadmin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('POST /api/auth/login - should validate input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '', password: '' });

    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me - should return 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - should return user with valid cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testadmin', password: 'testpass123!' });

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testadmin');
  });

  it('POST /api/auth/logout - should clear cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

  });

  it('PATCH /api/auth/password - should change password', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testadmin', password: 'testpass123!' });

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .patch('/api/auth/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'testpass123!', newPassword: 'newpass12345!' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const staleSession = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(staleSession.status).toBe(401);

    // Verify new password works
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testadmin', password: 'newpass12345!' });

    expect(login2.status).toBe(200);

    // Change back
    const cookie2 = login2.headers['set-cookie'];
    await request(app)
      .patch('/api/auth/password')
      .set('Cookie', cookie2)
      .send({ currentPassword: 'newpass12345!', newPassword: 'testpass123!' });
  });

  it('POST /api/auth/google - creates, returns, and protects Google identities', async () => {
    const payload = {
      sub: 'google-sub-new',
      email: 'google@example.com',
      email_verified: true,
      name: 'Google Operator',
      picture: 'https://example.com/avatar.png',
    };
    const verify = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation(async ({ idToken, audience }) => {
      expect(audience).toBe('test-google-client.apps.googleusercontent.com');
      if (idToken === 'invalid-or-expired') throw new Error('invalid token');
      return { getPayload: () => payload } as any;
    });

    const created = await request(app).post('/api/auth/google').send({ credential: 'valid-new' });
    expect(created.status).toBe(200);
    expect(created.body.email).toBe('google@example.com');
    expect(created.body.providers).toEqual(['google']);
    expect(created.body.onboardingCompleted).toBe(false);

    const returning = await request(app).post('/api/auth/google').send({ credential: 'valid-returning' });
    expect(returning.status).toBe(200);
    expect(returning.body.id).toBe(created.body.id);

    const onboarded = await request(app)
      .patch('/api/auth/onboarding')
      .set('Cookie', created.headers['set-cookie'])
      .send({ displayName: 'Signal Operator', username: 'signal-operator' });
    expect(onboarded.status).toBe(200);
    expect(onboarded.body.displayName).toBe('Signal Operator');
    expect(onboarded.body.username).toBe('signal-operator');
    expect(onboarded.body.onboardingCompleted).toBe(true);

    const invalid = await request(app).post('/api/auth/google').send({ credential: 'invalid-or-expired' });
    expect(invalid.status).toBe(401);
    expect(verify).toHaveBeenCalledTimes(3);
  });

  it('POST /api/auth/google - requires explicit linking for an existing password email', async () => {
    const passwordHash = await bcrypt.hash('existing-password-account', 10);
    await db.insert(users).values({ displayName: 'Existing Operator', email: 'operator@example.com', passwordHash });
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'password-account-google-sub',
        email: 'operator@example.com',
        email_verified: true,
      }),
    } as any);

    const res = await request(app).post('/api/auth/google').send({ credential: 'valid-existing-email' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ACCOUNT_LINK_REQUIRED');
  });
});

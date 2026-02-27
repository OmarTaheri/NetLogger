import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';
import { initDb } from '../db/index.js';
import { db } from '../db/index.js';
import { admins } from '../db/schema.js';
import bcrypt from 'bcrypt';

// We need to create the app without starting the server
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  initDb();
  // Seed test admin
  const hash = await bcrypt.hash('testpass123', 10);
  try {
    db.insert(admins).values({ username: 'testadmin', passwordHash: hash }).run();
  } catch {
    // Already exists
  }
  app = createApp();
});

describe('Auth Routes', () => {
  it('POST /api/auth/login - should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpass123' });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testadmin');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('POST /api/auth/login - should validate input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '', password: '' });

    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me - should return 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - should return user with valid cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpass123' });

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
      .send({ username: 'testadmin', password: 'testpass123' });

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .patch('/api/auth/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'testpass123', newPassword: 'newpass12345' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verify new password works
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'newpass12345' });

    expect(login2.status).toBe(200);

    // Change back
    const cookie2 = login2.headers['set-cookie'];
    await request(app)
      .patch('/api/auth/password')
      .set('Cookie', cookie2)
      .send({ currentPassword: 'newpass12345', newPassword: 'testpass123' });
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/index.js';
import { db, initDb } from '../src/database/index.js';
import { users } from '../src/database/schema.js';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await initDb();
  const passwordHash = await bcrypt.hash('admin-test-pass!', 10);
  await db.insert(users).values({
    displayName: 'Portal Admin',
    email: 'portal-admin@example.com',
    passwordHash,
    role: 'admin',
  });

  const userHash = await bcrypt.hash('standard-test-pass!', 10);
  await db.insert(users).values({
    displayName: 'Standard User',
    email: 'standard-user@example.com',
    passwordHash: userHash,
    role: 'user',
  });
  app = createApp();
});

describe('Admin portal', () => {
  it('requires an administrator email and password', async () => {
    const denied = await request(app).post('/api/auth/admin/login').send({
      email: 'standard-user@example.com',
      password: 'standard-test-pass!',
    });
    expect(denied.status).toBe(401);

    const login = await request(app).post('/api/auth/admin/login').send({
      email: 'portal-admin@example.com',
      password: 'admin-test-pass!',
    });
    expect(login.status).toBe(200);
    expect(login.body.role).toBe('admin');
    expect(login.headers['set-cookie']).toBeDefined();
  });

  it('protects overview and the read-only user list behind the admin role', async () => {
    const login = await request(app).post('/api/auth/admin/login').send({
      email: 'portal-admin@example.com',
      password: 'admin-test-pass!',
    });
    const cookie = login.headers['set-cookie'];

    const overview = await request(app).get('/api/admin/overview').set('Cookie', cookie);
    expect(overview.status).toBe(200);
    expect(overview.body.totalUsers).toBe(2);

    const listedUsers = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(listedUsers.status).toBe(200);
    expect(listedUsers.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'portal-admin@example.com', role: 'admin', linkCount: 0, visitorCount: 0 }),
      expect.objectContaining({ email: 'standard-user@example.com', role: 'user', linkCount: 0, visitorCount: 0 }),
    ]));

    const blockedUserApi = await request(app).get('/api/links').set('Cookie', cookie);
    expect(blockedUserApi.status).toBe(403);

    const absentSettingsApi = await request(app).get('/api/admin/settings').set('Cookie', cookie);
    expect(absentSettingsApi.status).toBe(404);

    const regularLogin = await request(app).post('/api/auth/login').send({
      identifier: 'standard-user@example.com',
      password: 'standard-test-pass!',
    });
    const denied = await request(app).get('/api/admin/users').set('Cookie', regularLogin.headers['set-cookie']);
    expect(denied.status).toBe(403);
  });
});

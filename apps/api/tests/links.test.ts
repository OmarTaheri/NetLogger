import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { initDb } from '../src/database/index.js';
import { db } from '../src/database/index.js';
import { users } from '../src/database/schema.js';
import bcrypt from 'bcrypt';

let app: ReturnType<typeof createApp>;
let cookie: string;

beforeAll(async () => {
  await initDb();
  const hash = await bcrypt.hash('testpass123!', 10);
  try {
    await db.insert(users).values({ username: 'testadmin', displayName: 'Test Admin', passwordHash: hash });
  } catch {}
  app = createApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'testadmin', password: 'testpass123!' });
  cookie = loginRes.headers['set-cookie'];
});

describe('Link Routes', () => {
  it('POST /api/links - should create a link', async () => {
    const res = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com',
        templateId: 'redirect',
        title: 'Test Link',
        gpsMode: 'optional',
      });

    expect(res.status).toBe(200);
    expect(res.body.slug).toBeDefined();
    expect(res.body.targetUrl).toBe('https://example.com');
    expect(res.body.templateId).toBe('redirect');
    expect(res.body.title).toBe('Test Link');
    expect(res.body.trackingUrl).toBeDefined();
  });

  it('POST /api/links - should validate URL', async () => {
    const res = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'not-a-url',
        templateId: 'redirect',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/links - should reject invalid template', async () => {
    const res = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com',
        templateId: 'invalid',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/links - should support expiration fields', async () => {
    const res = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com',
        templateId: 'redirect',
        expiresAt: '2030-01-01T00:00:00Z',
        maxVisits: 100,
      });

    expect(res.status).toBe(200);
    expect(res.body.expiresAt).toBe('2030-01-01T00:00:00Z');
    expect(res.body.maxVisits).toBe(100);
  });

  it('GET /api/links - should list links', async () => {
    const res = await request(app)
      .get('/api/links')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/links/:id - should get a link', async () => {
    const createRes = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com/get-test',
        templateId: 'gdrive',
      });

    const res = await request(app)
      .get(`/api/links/${createRes.body.id}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
  });

  it('PATCH /api/links/:id - should update a link', async () => {
    const createRes = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com/update-test',
        templateId: 'redirect',
      });

    const res = await request(app)
      .patch(`/api/links/${createRes.body.id}`)
      .set('Cookie', cookie)
      .send({ title: 'Updated Title', isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.isActive).toBe(false);
  });

  it('DELETE /api/links/:id - should delete a link', async () => {
    const createRes = await request(app)
      .post('/api/links')
      .set('Cookie', cookie)
      .send({
        targetUrl: 'https://example.com/delete-test',
        templateId: 'redirect',
      });

    const res = await request(app)
      .delete(`/api/links/${createRes.body.id}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const getRes = await request(app)
      .get(`/api/links/${createRes.body.id}`)
      .set('Cookie', cookie);

    expect(getRes.status).toBe(404);
  });

  it('should require authentication', async () => {
    const res = await request(app).get('/api/links');
    expect(res.status).toBe(401);
  });

  it('keeps link reads, updates, deletes, statistics, and domain assignment private', async () => {
    const secondPassword = 'another-secure-password';
    const secondHash = await bcrypt.hash(secondPassword, 10);
    await db.insert(users).values({ displayName: 'Second Operator', email: 'second@example.com', passwordHash: secondHash });
    const secondLogin = await request(app).post('/api/auth/login').send({ identifier: 'second@example.com', password: secondPassword });
    const secondCookie = secondLogin.headers['set-cookie'];

    const firstLink = await request(app).post('/api/links').set('Cookie', cookie).send({
      targetUrl: 'https://example.com/private-first',
      templateId: 'redirect',
      slug: 'private-first',
    });

    expect((await request(app).get(`/api/links/${firstLink.body.id}`).set('Cookie', secondCookie)).status).toBe(404);
    expect((await request(app).patch(`/api/links/${firstLink.body.id}`).set('Cookie', secondCookie).send({ title: 'stolen' })).status).toBe(404);
    expect((await request(app).delete(`/api/links/${firstLink.body.id}`).set('Cookie', secondCookie)).status).toBe(404);
    expect((await request(app).get(`/api/stats/link/${firstLink.body.id}`).set('Cookie', secondCookie)).status).toBe(404);

    const privateDomain = await request(app).post('/api/domains').set('Cookie', cookie).send({ domain: 'private.example.test' });
    const wrongDomain = await request(app).post('/api/links').set('Cookie', secondCookie).send({
      targetUrl: 'https://example.com/wrong-domain',
      templateId: 'redirect',
      domainId: privateDomain.body.id,
    });
    expect(wrongDomain.status).toBe(404);

    const duplicateSlug = await request(app).post('/api/links').set('Cookie', secondCookie).send({
      targetUrl: 'https://example.com/duplicate-slug',
      templateId: 'redirect',
      slug: 'private-first',
    });
    expect(duplicateSlug.status).toBe(409);

    const secondList = await request(app).get('/api/links').set('Cookie', secondCookie);
    expect(secondList.body.some((link: { id: number }) => link.id === firstLink.body.id)).toBe(false);
  });
});

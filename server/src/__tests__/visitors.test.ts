import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';
import { initDb } from '../db/index.js';
import { db } from '../db/index.js';
import { admins, visitors, links } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

let app: ReturnType<typeof createApp>;
let cookie: string;
let testLinkId: number;

beforeAll(async () => {
  initDb();
  const hash = await bcrypt.hash('testpass123', 10);
  try {
    db.insert(admins).values({ username: 'testadmin', passwordHash: hash }).run();
  } catch {}
  app = createApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testadmin', password: 'testpass123' });
  cookie = loginRes.headers['set-cookie'];

  // Create a test link
  const linkRes = await request(app)
    .post('/api/links')
    .set('Cookie', cookie)
    .send({
      targetUrl: 'https://example.com/visitor-test',
      templateId: 'redirect',
    });
  testLinkId = linkRes.body.id;

  // Insert some test visitors
  for (let i = 0; i < 5; i++) {
    db.insert(visitors).values({
      linkId: testLinkId,
      ip: `192.168.1.${i + 1}`,
      browser: i % 2 === 0 ? 'Chrome' : 'Firefox',
      os: i % 2 === 0 ? 'Windows' : 'macOS',
      gpsGranted: i % 3 === 0,
      ipCountry: 'US',
      ipCity: 'New York',
    } as any).run();
  }
});

describe('Visitor Routes', () => {
  it('GET /api/visitors - should list visitors', async () => {
    const res = await request(app)
      .get('/api/visitors')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.visitors).toBeDefined();
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('GET /api/visitors - should filter by linkId', async () => {
    const res = await request(app)
      .get(`/api/visitors?linkId=${testLinkId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.visitors.length).toBe(5);
  });

  it('GET /api/visitors - should search', async () => {
    const res = await request(app)
      .get('/api/visitors?search=Chrome')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.visitors.length).toBeGreaterThan(0);
    res.body.visitors.forEach((v: any) => {
      expect(
        v.browser?.includes('Chrome') || v.ip?.includes('Chrome') || v.os?.includes('Chrome')
      ).toBeTruthy();
    });
  });

  it('GET /api/visitors - should filter by browser', async () => {
    const res = await request(app)
      .get('/api/visitors?browser=Firefox')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    res.body.visitors.forEach((v: any) => {
      expect(v.browser).toBe('Firefox');
    });
  });

  it('GET /api/visitors - should paginate', async () => {
    const res = await request(app)
      .get('/api/visitors?limit=2&offset=0')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.visitors.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/visitors/:id - should get a visitor', async () => {
    const listRes = await request(app)
      .get('/api/visitors?limit=1')
      .set('Cookie', cookie);

    const visitorId = listRes.body.visitors[0].id;
    const res = await request(app)
      .get(`/api/visitors/${visitorId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(visitorId);
  });

  it('DELETE /api/visitors/:id - should delete a visitor', async () => {
    // Create a visitor to delete
    const v = db.insert(visitors).values({
      linkId: testLinkId,
      ip: '10.0.0.1',
      browser: 'DeleteMe',
      gpsGranted: false,
    } as any).returning().get();

    const res = await request(app)
      .delete(`/api/visitors/${v.id}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/visitors/bulk-delete - should bulk delete by ids', async () => {
    // Create visitors to delete
    const v1 = db.insert(visitors).values({ linkId: testLinkId, ip: '10.0.0.2', gpsGranted: false } as any).returning().get();
    const v2 = db.insert(visitors).values({ linkId: testLinkId, ip: '10.0.0.3', gpsGranted: false } as any).returning().get();

    const res = await request(app)
      .post('/api/visitors/bulk-delete')
      .set('Cookie', cookie)
      .send({ ids: [v1.id, v2.id] });

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(2);
  });

  it('GET /api/export/visitors/export - should export CSV', async () => {
    const res = await request(app)
      .get('/api/export/visitors/export')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
  });
});

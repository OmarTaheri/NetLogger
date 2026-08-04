import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { initDb } from '../src/database/index.js';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await initDb();
  app = createApp();
});

describe('Guest link builder', () => {
  it('exposes the restricted guest configuration', async () => {
    const response = await request(app)
      .get('/api/public/links/config')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'netlogger.example.com');
    expect(response.status).toBe(200);
    expect(response.body.defaultDomain).toBe('netlogger.example.com');
    expect(response.body.templates.map((template: { id: string }) => template.id)).toEqual(['redirect', 'captcha']);
    expect(response.body.limits.customDomains).toBe(false);
    expect(response.body.limits.maxVisits).toBe(25);
  });

  it('creates a short-lived guest link with private result access', async () => {
    const created = await request(app)
      .post('/api/public/links')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'netlogger.example.com')
      .send({
        targetUrl: 'https://example.com/guest-destination',
        templateId: 'redirect',
        title: 'Guest launch',
        gpsMode: 'disabled',
        templateOptions: {
          loadingMessage: 'Signal acquired',
          subMessage: 'Opening destination',
          ignored: 'not persisted',
        },
      });

    expect(created.status).toBe(201);
    expect(created.body.slug).toHaveLength(8);
    expect(created.body.maxVisits).toBe(25);
    expect(created.body.trackingUrl).toContain(`/t/redirect/${created.body.slug}`);
    expect(created.body.resultsUrl).toContain(`/create/results/${created.body.slug}#`);
    expect(created.body.trackingUrl).toMatch(/^https:\/\/netlogger\.example\.com\//);
    expect(created.body.resultsUrl).toMatch(/^https:\/\/netlogger\.example\.com\//);
    expect(new Date(created.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const denied = await request(app).get(`/api/public/links/${created.body.slug}/results`);
    expect(denied.status).toBe(404);

    const results = await request(app)
      .get(`/api/public/links/${created.body.slug}/results`)
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'netlogger.example.com')
      .set('x-guest-token', created.body.resultsToken);
    expect(results.status).toBe(200);
    expect(results.body.link.visitCount).toBe(0);
    expect(results.body.link.trackingUrl).toMatch(/^https:\/\/netlogger\.example\.com\//);
    expect(results.body.recentVisitors).toEqual([]);
    expect(results.body.limitations.upgradeFeatures).toContain('Custom domains');

    const template = await request(app).get(`/t/redirect/${created.body.slug}`);
    expect(template.status).toBe(200);
    expect(template.text).toContain('Signal acquired');
    expect(template.text).not.toContain('not persisted');
  });

  it('rejects premium templates and unsafe destinations', async () => {
    const premium = await request(app).post('/api/public/links').send({
      targetUrl: 'https://example.com',
      templateId: 'gdrive',
    });
    expect(premium.status).toBe(400);

    const unsafe = await request(app).post('/api/public/links').send({
      targetUrl: 'http://localhost:4000/private',
      templateId: 'redirect',
    });
    expect(unsafe.status).toBe(400);
  });
});

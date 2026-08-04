import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { initDb } from '../src/database/index.js';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await initDb();
  app = createApp();
});

describe('Template previews', () => {
  it('renders the same configured template document without active scripts', async () => {
    const response = await request(app)
      .post('/api/templates/preview')
      .send({
        templateId: 'gdrive',
        templateOptions: { fileName: 'Launch brief.pdf', fileType: 'pdf', fileSize: '8 MB', ownerEmail: 'owner@example.test' },
      });

    expect(response.status).toBe(200);
    expect(response.body.html).toContain('Launch brief.pdf');
    expect(response.body.html).toContain('Google Drive');
    expect(response.body.html).not.toContain('<script');
    expect(response.body.html).not.toContain('collector.js');
  });

  it('rejects unknown template IDs', async () => {
    const response = await request(app)
      .post('/api/templates/preview')
      .send({ templateId: 'unknown' });

    expect(response.status).toBe(400);
  });
});

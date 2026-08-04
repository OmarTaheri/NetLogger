import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { resolve4, resolve6, resolveCname, resolveTxt } from 'node:dns/promises';
import { createApp } from '../src/index.js';
import { db, initDb } from '../src/database/index.js';
import { users } from '../src/database/schema.js';

vi.mock('node:dns/promises', () => ({
  resolveTxt: vi.fn(),
  resolveCname: vi.fn(),
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

let app: ReturnType<typeof createApp>;
let cookie: string;

beforeAll(async () => {
  await initDb();
  const passwordHash = await bcrypt.hash('domain-test-pass!', 10);
  await db.insert(users).values({ displayName: 'Domain Operator', email: 'domains@example.com', passwordHash });
  app = createApp();
  const login = await request(app).post('/api/auth/login').send({ identifier: 'domains@example.com', password: 'domain-test-pass!' });
  cookie = login.headers['set-cookie'];
  vi.mocked(resolve4).mockResolvedValue([]);
  vi.mocked(resolve6).mockResolvedValue([]);
});

describe('Custom-domain verification', () => {
  it('keeps new domains inactive until DNS ownership and routing checks pass', async () => {
    const created = await request(app).post('/api/domains').set('Cookie', cookie).send({ domain: 'links.example.test' });
    expect(created.status).toBe(200);
    expect(created.body.isActive).toBe(false);
    expect(created.body.verificationStatus).toBe('pending');
    expect(created.body.verification.recordName).toBe('_netlogger-verification.links.example.test');
    expect(created.body.verification.cnameTarget).toBe('app.netlogger.test');

    vi.mocked(resolveTxt).mockResolvedValue([]);
    vi.mocked(resolveCname).mockResolvedValue([]);
    const waiting = await request(app).post(`/api/domains/${created.body.id}/verify`).set('Cookie', cookie);
    expect(waiting.status).toBe(200);
    expect(waiting.body.isActive).toBe(false);
    expect(waiting.body.verificationStatus).toBe('pending');

    vi.mocked(resolveTxt).mockResolvedValue([[created.body.verification.recordValue]]);
    vi.mocked(resolveCname).mockResolvedValue(['app.netlogger.test']);
    const verified = await request(app).post(`/api/domains/${created.body.id}/verify`).set('Cookie', cookie);
    expect(verified.status).toBe(200);
    expect(verified.body.isActive).toBe(true);
    expect(verified.body.verificationStatus).toBe('verified');
    expect(verified.body.verifiedAt).toBeTruthy();
  });
});

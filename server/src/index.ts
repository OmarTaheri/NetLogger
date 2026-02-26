import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import bcrypt from 'bcrypt';

import { config } from './config.js';
import { db, initDb } from './db/index.js';
import { admins, domains } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { wsManager } from './ws/index.js';
import * as domainService from './services/domain.service.js';
import { sanitizeDomain } from './utils/domain.js';

import authRoutes from './routes/auth.routes.js';
import linksRoutes from './routes/links.routes.js';
import visitorsRoutes from './routes/visitors.routes.js';
import statsRoutes from './routes/stats.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import collectRoutes from './routes/collect.routes.js';
import templatesRoutes from './routes/templates.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({
  origin: new URL(config.baseUrl).origin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static files for templates (collector.js, css, images)
app.use('/static', express.static(path.join(__dirname, '../static')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/domains', domainsRoutes);

// Health check for container orchestration (Coolify, etc.)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public routes
app.use('/c', collectRoutes);
app.use('/t', templatesRoutes);

// Serve built React client in production
const clientPath = path.join(__dirname, '../static/client');
app.use(express.static(clientPath));
app.get('*', (req, res) => {
  // Don't serve index.html for API/template/collect routes
  if (req.path.startsWith('/api') || req.path.startsWith('/t/') || req.path.startsWith('/c/') || req.path.startsWith('/static')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Initialize
const server = createServer(app);
wsManager.init(server);

async function start() {
  // Init database tables
  initDb();

  // Seed admin user
  const existing = db.select().from(admins).where(eq(admins.username, config.adminUsername)).get();
  if (!existing) {
    const hash = await bcrypt.hash(config.adminPassword, 10);
    db.insert(admins).values({
      username: config.adminUsername,
      passwordHash: hash,
    }).run();
    console.log(`Admin user "${config.adminUsername}" created`);
  }

  // Seed server domain
  const baseHost = sanitizeDomain(config.baseUrl);
  const existingDomain = db.select().from(domains).where(eq(domains.domain, baseHost)).get();
  if (!existingDomain) {
    domainService.createDomain(baseHost);
    console.log(`Domain "${baseHost}" auto-added`);
  }

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Base URL: ${config.baseUrl}`);
  });
}

start().catch(console.error);

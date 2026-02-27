import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import bcrypt from 'bcrypt';

import { config } from './config.js';
import { db, initDb } from './db/index.js';
import { admins, domains } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { wsManager } from './ws/index.js';
import * as domainService from './services/domain.service.js';
import { sanitizeDomain } from './utils/domain.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import { cleanupOldVisitors } from './services/cleanup.service.js';

import authRoutes from './routes/auth.routes.js';
import linksRoutes from './routes/links.routes.js';
import visitorsRoutes from './routes/visitors.routes.js';
import statsRoutes from './routes/stats.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import collectRoutes from './routes/collect.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import exportRoutes from './routes/export.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

// cwd is project root in Docker (/app) but server/ dir in dev (npm -w server)
const serverRoot = process.cwd().endsWith('server') ? process.cwd() : path.join(process.cwd(), 'server');
const staticDir = path.join(serverRoot, 'static');
const clientPath = path.join(staticDir, 'client');

export function createApp() {
  const app = express();

  // Security headers (CSP disabled for template CDN scripts)
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  app.use(cors({
    origin: new URL(config.baseUrl).origin,
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({ method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start }, 'request');
    });
    next();
  });

  // Blanket rate limit on API routes
  // CSRF note: SameSite=Strict cookies + JSON Content-Type (triggers CORS preflight) = sufficient protection
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Static files for templates (collector.js, css, images)
  app.use('/static', express.static(staticDir));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/links', linksRoutes);
  app.use('/api/visitors', visitorsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/domains', domainsRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/webhooks', webhooksRoutes);

  // Health check for container orchestration (Coolify, etc.)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public routes
  app.use('/c', collectRoutes);
  app.use('/t', templatesRoutes);

  // Serve built React client in production
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    // Don't serve index.html for API/template/collect routes
    if (req.path.startsWith('/api') || req.path.startsWith('/t/') || req.path.startsWith('/c/') || req.path.startsWith('/static')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });

  // Global error handler (must be after all routes)
  app.use(errorHandler);

  return app;
}

// Only run the server when not in test mode
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
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
      logger.info(`Admin user "${config.adminUsername}" created`);
    }

    // Seed server domain
    const baseHost = sanitizeDomain(config.baseUrl);
    const existingDomain = db.select().from(domains).where(eq(domains.domain, baseHost)).get();
    if (!existingDomain) {
      domainService.createDomain(baseHost);
      logger.info(`Domain "${baseHost}" auto-added`);
    }

    // Run data cleanup on startup and every hour
    cleanupOldVisitors();
    setInterval(cleanupOldVisitors, 60 * 60 * 1000);

    server.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
      logger.info(`Base URL: ${config.baseUrl}`);
    });
  }

  start().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}

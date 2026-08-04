import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

import { config } from './config.js';
import { db, initDb } from './database/index.js';
import { domains } from './database/schema.js';
import { eq } from 'drizzle-orm';
import { wsManager } from './realtime/index.js';
import * as domainService from './services/domain.service.js';
import { sanitizeDomain } from './utils/domain.js';
import { getConfiguredPublicBaseUrl } from './utils/public-url.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import { cleanupOldVisitors } from './services/cleanup.service.js';
import { ensureDefaultAccounts, refreshDemoData } from './services/seed.service.js';

import authRoutes from './routes/auth.routes.js';
import linksRoutes from './routes/links.routes.js';
import visitorsRoutes from './routes/visitors.routes.js';
import statsRoutes from './routes/stats.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import collectRoutes from './routes/collect.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import exportRoutes from './routes/export.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import publicLinksRoutes from './routes/public-links.routes.js';
import adminRoutes from './routes/admin.routes.js';
import templatePreviewRoutes from './routes/template-preview.routes.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(apiRoot, 'static');
const webPath = path.join(staticDir, 'web');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // Security headers (CSP disabled for template CDN scripts)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }));

  app.use(cors({
    origin: new URL(config.baseUrl).origin,
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
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
  app.use('/api/public/links', publicLinksRoutes);
  app.use('/api/templates/preview', templatePreviewRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check for container orchestration (Coolify, etc.)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public routes
  app.use('/c', collectRoutes);
  app.use('/t', templatesRoutes);

  // Serve the production web build.
  app.use(express.static(webPath));
  app.get('*', (req, res) => {
    // Don't serve index.html for API/template/collect routes
    if (req.path.startsWith('/api') || req.path.startsWith('/t/') || req.path.startsWith('/c/') || req.path.startsWith('/static')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.sendFile(path.join(webPath, 'index.html'));
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
    await initDb();

    const { admin, demoUser } = await ensureDefaultAccounts();
    if (config.seedDemoData && demoUser) {
      await refreshDemoData(demoUser.id);
    }

    // Seed server domain
    const configuredPublicUrl = getConfiguredPublicBaseUrl();
    const baseHost = configuredPublicUrl && sanitizeDomain(configuredPublicUrl);
    const existingDomain = baseHost ? (await db.select().from(domains).where(eq(domains.domain, baseHost)).limit(1))[0] : null;
    if (baseHost && !existingDomain) {
      await domainService.createDomain(admin.id, baseHost);
      logger.info(`Domain "${baseHost}" auto-added`);
    }

    // Run data cleanup on startup and every hour
    void cleanupOldVisitors();
    setInterval(() => { void cleanupOldVisitors(); }, 60 * 60 * 1000);

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

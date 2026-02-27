# GPS Tracker — Visitor Intelligence Platform

A full-stack visitor intelligence platform built with React 19, Express, SQLite/Drizzle ORM, and Tailwind CSS with a HUD-themed interface. Tracks visitors via customizable link templates, collects 150+ device fingerprints, performs real-time analysis (bot detection, VPN detection, browser authenticity), and displays everything in a tactical dashboard.

## Features

- **Link Tracking** — Create short links with customizable templates (Redirect, Google Drive, Dropbox, CAPTCHA, WeTransfer)
- **GPS Collection** — Request location access with configurable modes (required/optional/disabled)
- **Device Fingerprinting** — 150+ data points including canvas, audio, WebGL, behavioral biometrics
- **Real-time Analysis** — Bot detection, VPN detection, privacy scoring, device tier classification
- **Dashboard & Charts** — Live visitor feed, maps, analytics charts (visitors over time, browser/OS distribution)
- **Visitor Search & Filtering** — Search by IP, browser, OS, city, country with sortable columns
- **CSV Export** — Export visitor data to CSV
- **Bulk Operations** — Select and delete multiple visitors at once
- **Webhooks** — Configure webhooks for `new_visitor` and `high_risk_visitor` events with optional HMAC signing
- **Link Expiration** — Set expiration dates and max visit limits on links
- **Audit Logging** — Track admin actions (link CRUD, login, password changes, etc.)
- **Custom Domains** — Use your own domains for tracking URLs
- **Real-time Updates** — WebSocket-powered live visitor notifications
- **Mobile Responsive** — Hamburger menu and responsive layout for mobile devices
- **Keyboard Shortcuts** — Alt+1-6 for navigation, Escape to close modals

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd gps

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Generate and run database migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `changeme` | Admin login password |
| `SESSION_SECRET` | `dev-secret` | JWT signing secret |
| `DATABASE_PATH` | `./data/tracker.db` | SQLite database path |
| `BASE_URL` | `http://localhost:3000` | Base URL for tracking links |
| `DATA_RETENTION_DAYS` | `0` | Auto-delete visitors older than N days (0 = disabled) |
| `WEBHOOK_TIMEOUT_MS` | `5000` | Webhook delivery timeout in milliseconds |
| `LOG_LEVEL` | `info` | Pino log level (trace/debug/info/warn/error/fatal) |

## Architecture

```
gps/
├── server/          # Express.js backend
│   ├── src/
│   │   ├── index.ts          # App entry point
│   │   ├── config.ts         # Environment configuration
│   │   ├── db/               # Drizzle ORM schema & init
│   │   ├── middleware/       # Auth, error handling
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── templates/        # HTML template renderers
│   │   ├── utils/            # Helpers (logger, validation, etc.)
│   │   └── ws/               # WebSocket manager
│   └── static/               # Built client + collector.js
├── client/          # React 19 frontend
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # UI components
│   │   ├── hooks/            # React hooks
│   │   └── pages/            # Page components
├── shared/          # Shared TypeScript types
├── drizzle/         # Database migrations
└── data/            # SQLite database
```

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/logout` — Logout (clears cookie)
- `GET /api/auth/me` — Get current admin info
- `PATCH /api/auth/password` — Change password

### Links
- `GET /api/links` — List all links
- `POST /api/links` — Create link
- `GET /api/links/:id` — Get link
- `PATCH /api/links/:id` — Update link
- `DELETE /api/links/:id` — Delete link

### Visitors
- `GET /api/visitors` — List visitors (with search, filter, sort, pagination)
- `GET /api/visitors/:id` — Get visitor details
- `DELETE /api/visitors/:id` — Delete visitor
- `POST /api/visitors/bulk-delete` — Bulk delete visitors
- `GET /api/visitors/audit` — Get audit logs

### Stats
- `GET /api/stats` — Global statistics
- `GET /api/stats/link/:id` — Per-link statistics

### Domains
- `GET /api/domains` — List domains
- `POST /api/domains` — Add domain
- `PATCH /api/domains/:id` — Update domain
- `DELETE /api/domains/:id` — Delete domain

### Webhooks
- `GET /api/webhooks` — List webhooks
- `POST /api/webhooks` — Create webhook
- `PATCH /api/webhooks/:id` — Update webhook
- `DELETE /api/webhooks/:id` — Delete webhook

### Export
- `GET /api/export/visitors/export` — Export visitors as CSV

### Public
- `GET /t/:templateId/:slug` — Serve tracking page
- `POST /c/:slug` — Collect visitor data
- `GET /api/health` — Health check

## Templates

| Template | Description |
|---|---|
| **Redirect** | Loading spinner with customizable message, then redirects |
| **Google Drive** | Mimics Google Drive "Request access" page |
| **Dropbox** | Mimics Dropbox shared folder invitation |
| **CAPTCHA** | Fake "I'm not a robot" checkbox verification |
| **WeTransfer** | Mimics WeTransfer download page |

## Docker Deployment

```bash
docker compose up -d
```

Or build manually:

```bash
docker build -t gps-tracker .
docker run -d -p 3000:3000 -v ./data:/app/data gps-tracker
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, React Router 7, Recharts, Leaflet
- **Backend:** Express 4, TypeScript, Drizzle ORM, better-sqlite3, Pino, Helmet, Zod
- **Real-time:** WebSocket (ws)
- **Database:** SQLite with WAL mode

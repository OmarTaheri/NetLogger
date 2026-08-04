# NetLogger

NetLogger is a visitor-intelligence platform with a React web application, an Express API, PostgreSQL persistence, tracking-page templates, and a browser fingerprint collector.

## Project layout

```text
NetLogger/
├── apps/
│   ├── api/                    # Express API and production static host
│   │   ├── src/
│   │   │   ├── database/       # Drizzle schema and database initialization
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── realtime/       # WebSocket management
│   │   │   ├── routes/         # HTTP route definitions
│   │   │   ├── services/       # Application and domain logic
│   │   │   ├── tracking-collector/ # Browser-side collector source
│   │   │   ├── tracking-templates/ # Public tracking-page renderers
│   │   │   └── utils/          # Shared API utilities
│   │   ├── tests/              # API tests
│   │   └── static/             # Generated production assets
│   └── web/                    # React and Vite web application
│       ├── public/media/        # Static images, videos, fonts, icons, and models
│       └── src/                 # Web application source
├── packages/
│   └── shared/                 # Types and constants shared by applications
├── database/
│   ├── migrations-pg/          # PostgreSQL Drizzle migrations
│   └── init/                   # First-run PostgreSQL initialization
├── compose.yml
├── Dockerfile
└── package.json
```

## Local development

Requirements: Node.js 18+, npm 9+, and Docker Desktop (for PostgreSQL).

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run dev
```

- Web development server: `http://localhost:5173`
- API server: the `BASE_URL` and `PORT` values in `.env`

The root development scripts launch processes directly from the repository root. This keeps path behavior consistent across npm workspaces and Windows directories containing non-ASCII characters.

## Production build

```bash
npm run build
npm start
```

The web build is generated in `apps/api/static/web`, and the API serves it from the configured port.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run the API and Vite development servers |
| `npm run build` | Build the web app, API, and tracking collector |
| `npm test` | Run API tests |
| `npm run db:generate` | Generate a migration after a schema change |
| `npm run db:migrate` | Apply database migrations |
| `npm start` | Run the production build |

## Static media

Place large static assets under `apps/web/public/media` by type. Vite serves them from `/media/...` without bundling them into JavaScript.

Examples:

```text
/media/images/dashboard-preview.webp
/media/videos/hero.mp4
/media/icons/logo.svg
/media/fonts/interface.woff2
/media/models/gps-radar-module.glb
```

See `apps/web/public/media/README.md` for naming rules.

## Docker

```bash
docker compose up --build
```

The application is available at `http://localhost:3000`. PostgreSQL data persists in the `netlogger-postgres` Docker volume. The application applies its migrations and seeds the two default accounts when it starts.

## Default local credentials

After a new database is created, NetLogger seeds two local accounts:

| Account | Sign-in | Password |
|---|---|---|
| Administrator | `admin@netlogger.local` at `/admin/login` | `Admin123456!` |
| Standard user | `user@netlogger.local` at `/login` | `User12345678!` |

Change these environment values and `SESSION_SECRET` before exposing the application beyond your computer. Configure Google sign-in only through `GOOGLE_CLIENT_ID` in the server environment; the administrator portal is read-only.

`SHOW_DEMO_ACCOUNTS=true` exposes the two local demo account cards on the sign-in pages so their credentials can be filled with one click. Keep it `false` for any public deployment.

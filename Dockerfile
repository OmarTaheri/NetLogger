FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Copy source
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY database/ ./database/
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Build the web app, API, and browser collector.
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/
COPY --from=builder /app/apps/api/static/ ./apps/api/static/
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules/ ./apps/api/node_modules/
COPY --from=builder /app/packages/shared/ ./packages/shared/
COPY --from=builder /app/database/ ./database/
COPY --from=builder /app/node_modules/ ./node_modules/

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "apps/api/dist/index.js"]

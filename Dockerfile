FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY shared/package.json ./shared/

RUN npm ci

# Copy source
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Build client (outputs to server/static/client/)
RUN cd client && npx vite build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/server/ ./server/
COPY --from=builder /app/shared/ ./shared/
COPY --from=builder /app/node_modules/ ./node_modules/

RUN mkdir -p /data

ENV DATABASE_PATH=/data/tracker.db
ENV NODE_ENV=production

VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npx", "tsx", "server/src/index.ts"]

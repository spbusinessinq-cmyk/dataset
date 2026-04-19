FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-zod/package.json lib/api-zod/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/rsr-data-hub/package.json artifacts/rsr-data-hub/
RUN pnpm install --no-frozen-lockfile
# ── Build everything ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
# Build shared libs
RUN pnpm --filter @workspace/api-spec run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-zod run build
RUN pnpm --filter @workspace/api-client-react run build
# Build frontend
RUN pnpm --filter @workspace/rsr-data-hub run build
# Build backend
RUN pnpm --filter @workspace/api-server run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV FRONTEND_DIST=/app/frontend

# Copy backend build
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json

# Copy frontend build
COPY --from=builder /app/artifacts/rsr-data-hub/dist /app/frontend

# Copy workspace files for production deps
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Create data directory with volume mount point
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.js"]

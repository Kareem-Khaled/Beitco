# syntax=docker/dockerfile:1
# Multi-stage build for the Beitoon NestJS API (OPS-2).
# Build context MUST be the repo root: `docker build -f apps/api/Dockerfile .`
# (the pnpm lockfile + workspace manifest live at the root).

# ---- base: node + pnpm + openssl (Prisma needs it) ----
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: install the API's dependency closure (cached on lockfile) ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# --ignore-scripts: the shared package's prepare (build) can't run yet (its src
# isn't copied in this deps-only layer); we build it explicitly in the next stage.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --filter "@beitoon/api..." --ignore-scripts

# ---- build: generate the Prisma client + compile TS ----
FROM deps AS build
COPY apps/api apps/api
COPY packages packages
# Build the shared workspace package first (the API imports @beitoon/shared).
RUN pnpm --filter @beitoon/shared run build
RUN pnpm --filter @beitoon/api exec prisma generate
RUN pnpm --filter @beitoon/api run build
# Produce a self-contained, production-only bundle in /app/out (real node_modules,
# not a symlink farm  -  pnpm 9 `deploy` flattens it), then generate the Prisma
# client INSIDE that bundle (prisma CLI is a prod dep, so it's present in /app/out).
RUN pnpm --filter @beitoon/api deploy --prod /app/out
RUN cd /app/out && pnpm exec prisma generate

# ---- runtime: slim, non-root ----
FROM base AS runtime
ENV NODE_ENV=production
ENV API_PORT=3001
WORKDIR /app
COPY --from=build /app/out/node_modules ./node_modules
COPY --from=build /app/out/dist ./dist
COPY --from=build /app/out/prisma ./prisma
COPY --from=build /app/out/package.json ./package.json
EXPOSE 3001
USER node
# `migrate deploy` is run as a separate step in CD (OPS-3), not on container start.
CMD ["node", "dist/main.js"]

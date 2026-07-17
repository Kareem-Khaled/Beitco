# syntax=docker/dockerfile:1
# Web (TanStack Start SSR) image — OPS-2.
#
# NOTE: the web app's Vite config (@lovable.dev/vite-tanstack-config) targets
# **Cloudflare** by default, so the primary deploy path is Cloudflare Pages/
# Workers (`pnpm --filter web build` → deploy `.output`). This Dockerfile is a
# portable **Node-server fallback** (nitro `node-server` preset) for running the
# SSR app in a plain container alongside the API.
#
# Build context MUST be the repo root: `docker build -f apps/web/Dockerfile .`

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# --ignore-scripts: shared's prepare (build) can't run in this deps-only layer
# (src isn't copied yet); we build it explicitly in the build stage below.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --filter "tanstack_start_ts..." --ignore-scripts

# ---- build (node-server preset so it runs in a container) ----
FROM deps AS build
COPY apps/web apps/web
COPY packages packages
# Build the shared workspace package first (the web app imports @beitoon/shared).
RUN pnpm --filter @beitoon/shared run build
# VITE_USE_API + VITE_API_URL are baked at build time; override per environment.
ARG VITE_USE_API=true
ARG VITE_API_URL=http://localhost:3001/api/v1
ENV VITE_USE_API=$VITE_USE_API VITE_API_URL=$VITE_API_URL
ENV NITRO_PRESET=node-server
RUN pnpm --filter tanstack_start_ts run build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/apps/web/.output ./.output
EXPOSE 8080
USER node
CMD ["node", ".output/server/index.mjs"]

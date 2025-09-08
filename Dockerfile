# ---- Build Stage ----
FROM node:lts-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# Install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run build

# Prune dev dependencies to keep only production deps
RUN pnpm prune --prod

# ---- Production Stage (Distroless) ----
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

# Copy built JS and production-only node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["dist/src/main.js"]

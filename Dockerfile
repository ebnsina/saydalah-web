# --- build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Install deps against the lockfile first (better layer caching).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# API base URL is baked in at build time (Vite env). Override with:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 .
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_CURRENCY=BDT
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CURRENCY=$VITE_CURRENCY
RUN pnpm run build
RUN pnpm prune --prod

# --- runtime stage -----------------------------------------------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "build"]

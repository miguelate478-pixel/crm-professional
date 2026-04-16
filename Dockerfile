FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Install dependencies (copy patches too since pnpm needs them)
COPY package.json pnpm-lock.yaml .npmrc ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@10.4.1

# Copy built files
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Create data directory for SQLite persistence
RUN mkdir -p /data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]

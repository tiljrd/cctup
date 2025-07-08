# Multi-stage Dockerfile for CCIP UI with Hardhat support
# Supports runtime configuration via YAML files

# Stage 1: Base dependencies
FROM node:18-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Stage 2: Install dependencies (including Hardhat deps)
FROM base AS deps
COPY package.json ./
COPY lib/ccip-starter-kit-hardhat/package.json ./lib/ccip-starter-kit-hardhat/
RUN pnpm install --frozen-lockfile
# Install Hardhat dependencies
RUN cd lib/ccip-starter-kit-hardhat && npm install

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

# Accept build argument for config file path
ARG NEXT_PUBLIC_CCIP_CONFIG_FILE=/network-config.yaml
ENV NEXT_PUBLIC_CCIP_CONFIG_FILE=$NEXT_PUBLIC_CCIP_CONFIG_FILE

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/ccip-starter-kit-hardhat/node_modules ./lib/ccip-starter-kit-hardhat/node_modules

# Copy source code
COPY . .

# Build Hardhat contracts first (this happens in prebuild script)
# Then build the Next.js application
RUN pnpm run build

# Stage 4: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the entire Hardhat project for runtime task execution
COPY --from=builder --chown=nextjs:nodejs /app/lib/ccip-starter-kit-hardhat ./lib/ccip-starter-kit-hardhat

# Ensure the default config exists
COPY --from=builder /app/public/network-config.yaml ./public/network-config.yaml

# Create public directory and set permissions
USER root
RUN mkdir -p ./public && chown -R nextjs:nodejs ./public ./src
# Install npm globally for hardhat task execution
RUN npm install -g npm

USER nextjs

EXPOSE 3001
ENV PORT 3001

CMD ["node", "server.js"] 
# brokerHub API Service - Production Dockerfile
FROM node:20 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root package files (for workspaces)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install all dependencies (root + workspaces)
RUN npm ci

# Copy API source code
COPY apps/api ./apps/api

# Build TypeScript
WORKDIR /app/apps/api
RUN npx tsc

# ============================================
# Production Image
# ============================================
FROM node:20-slim

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -d /home/nodejs nodejs

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./package.json

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

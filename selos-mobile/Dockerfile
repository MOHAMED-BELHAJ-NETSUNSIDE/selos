# Selos Mobile Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY selos-mobile/package*.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY selos-mobile/ ./
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built files
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY selos-mobile/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3003

CMD ["nginx", "-g", "daemon off;"]


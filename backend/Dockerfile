# Backend Dockerfile

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runtime
WORKDIR /app
# Copy the built server code and package file
COPY --from=builder /app/dist .
COPY --from=builder /app/package.json ./package.json
RUN npm install --omit=dev

# Install ffmpeg (includes ffprobe), nginx, and supervisor
RUN apk add --no-cache ffmpeg nginx supervisor bash

# Copy the complete Nginx configuration into the main config file location
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy Supervisor configuration file
COPY --from=builder /app/supervisord.conf /etc/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

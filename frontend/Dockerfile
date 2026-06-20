# ─────────────────────────────────────────────────────────────────
# Stage 1: builder — install deps and build React app
# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions and install (utilizing Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application for production (creates /app/dist)
# Use relative URL so requests hit Nginx reverse proxy instead of bypassing it
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: runtime — serve static files via Nginx
# ─────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

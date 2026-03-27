# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Note: No build args needed anymore; we use runtime injection!
RUN npm run build

# Production Stage
FROM nginx:stable-alpine
# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config to handle SPA routing (404 fix)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup the runtime environment injection script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

# Use the entrypoint to generate env-config.js before starting nginx
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass build arguments for Vite (required at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ONBOARDING_WEBHOOK_URL
ARG VITE_MOM_BOT_WEBHOOK_URL
ARG VITE_SMART_COMM_WEBHOOK_URL

# Set environment variables for the build command
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_ONBOARDING_WEBHOOK_URL=$VITE_ONBOARDING_WEBHOOK_URL
ENV VITE_MOM_BOT_WEBHOOK_URL=$VITE_MOM_BOT_WEBHOOK_URL
ENV VITE_SMART_COMM_WEBHOOK_URL=$VITE_SMART_COMM_WEBHOOK_URL

RUN npm run build

# Production Stage
FROM nginx:stable-alpine
# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config to handle SPA routing (404 fix)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#!/bin/sh

# Create the environment config file from current ENV variables (Supabase only)
echo "window.__VITE_SUPABASE_URL__ = \"${VITE_SUPABASE_URL}\";" > /usr/share/nginx/html/env-config.js
echo "window.__VITE_SUPABASE_ANON_KEY__ = \"${VITE_SUPABASE_ANON_KEY}\";" >> /usr/share/nginx/html/env-config.js

# Execute the original Nginx command
exec "$@"

#!/bin/sh

# Create the environment config file from current ENV variables
echo "window.__VITE_SUPABASE_URL__ = \"${VITE_SUPABASE_URL}\";" > /usr/share/nginx/html/env-config.js
echo "window.__VITE_SUPABASE_ANON_KEY__ = \"${VITE_SUPABASE_ANON_KEY}\";" >> /usr/share/nginx/html/env-config.js
echo "window.__VITE_ONBOARDING_WEBHOOK_URL__ = \"${VITE_ONBOARDING_WEBHOOK_URL}\";" >> /usr/share/nginx/html/env-config.js
echo "window.__VITE_MOM_BOT_WEBHOOK_URL__ = \"${VITE_MOM_BOT_WEBHOOK_URL}\";" >> /usr/share/nginx/html/env-config.js
echo "window.__VITE_SMART_COMM_WEBHOOK_URL__ = \"${VITE_SMART_COMM_WEBHOOK_URL}\";" >> /usr/share/nginx/html/env-config.js

# Execute the original Nginx command
exec "$@"

const { createClient } = require('@supabase/supabase-js');
const url = 'https://creteaebjohsohwfxrrw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZXRlYWViam9oc29od2Z4cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYzNDEsImV4cCI6MjA4OTMxMjM0MX0.HNe1oRZ_lxWD60Rj3XEf4Uh40K3maTiYRs8C9J6Dw6E';
const s = createClient(url, key);

async function check() {
  const { data: rooms, error } = await s.from('rooms').select('*');
  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log('Rooms Data:', rooms);
  }
}
check();

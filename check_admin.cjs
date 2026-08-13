const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k] = v.replace(/"/g, '').trim();
  return acc;
}, {});

async function run() {
  const url = env.VITE_SUPABASE_URL + '/rest/v1/profiles?select=*';
  const res = await fetch(url, {
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: 'Bearer ' + env.VITE_SUPABASE_PUBLISHABLE_KEY
    }
  });
  const data = await res.json();
  const admins = data.filter(p => p.role === 'admin' || p.role === 'superadmin' || p.full_name?.toLowerCase().includes('arsyad') || p.username?.toLowerCase().includes('arsyad'));
  console.log('Admins/Arsyad:', admins);
}
run();

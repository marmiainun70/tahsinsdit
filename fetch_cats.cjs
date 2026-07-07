const fs = require('fs'); 
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => { 
  const [k, ...vParts] = line.split('=');
  const v = vParts.join('=');
  if(k && v) acc[k.trim()] = v.trim().replace(/"/g, ''); 
  return acc; 
}, {}); 
fetch(env.VITE_SUPABASE_URL + '/rest/v1/bank_soal?select=kategori,sub_aspek&limit=1000', { 
  headers: { 
    'apikey': env.VITE_SUPABASE_PUBLISHABLE_KEY, 
    'Authorization': 'Bearer ' + env.VITE_SUPABASE_PUBLISHABLE_KEY 
  } 
})
.then(r => r.json())
.then(data => {
  if (Array.isArray(data)) {
    const categories = new Set(data.map(d => d.kategori));
    const sub_aspek = new Set(data.map(d => d.sub_aspek));
    console.log("Existing categories:", Array.from(categories));
    console.log("Existing sub_aspek:", Array.from(sub_aspek));
  } else {
    console.log("Response:", data);
  }
})
.catch(console.error);

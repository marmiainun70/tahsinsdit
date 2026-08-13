const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const envContent = fs.readFileSync('.env', 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k] = v.replace(/"/g, '').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: students, error: err1 } = await supabase
    .from('students')
    .select('id, nama, kelas, rombel')
    .ilike('nama', '%askana%');
    
  if (err1) {
    console.error("Error finding student:", err1);
    return;
  }
  
  console.log("Students found matching 'askana':", students);
}

run();

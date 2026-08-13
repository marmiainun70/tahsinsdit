const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync('.env', 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k] = v.replace(/"/g, '').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', 'ysds');
  console.log("Profiles matching ysds:", data);
}

run();

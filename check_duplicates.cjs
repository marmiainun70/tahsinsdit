const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(".env_utf8", "utf8");
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim().replace(/^\uFEFF/, '')] = match[2].trim();
  }
});
const url = envVars.VITE_SUPABASE_URL?.replace(/['"\r]/g, '')?.trim();
const key = (envVars.VITE_SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_ANON_KEY)?.replace(/['"\r]/g, '')?.trim();
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('list_managed_accounts');
  console.log('Error:', error);
  if (data) {
    console.log('Result length:', data.length);
    console.log('Duplicates?', data.filter(r => r.full_name?.includes("Miftahul")));
  }
}
run();

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function getEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
  return env;
}

const env = getEnv();
const url = env.VITE_SUPABASE_URL?.replace(/^["']|["']$/g, '');
const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.replace(/^["']|["']$/g, '').trim();

const supabase = createClient(url, key);

async function testQueries() {
  console.log("--- Testing profiles ---");
  const pRes = await supabase.from("profiles").select("*");
  console.log("profiles res:", pRes.error || `count: ${pRes.data?.length}`);

  console.log("--- Testing user_roles ---");
  const urRes = await supabase.from("user_roles").select("*");
  console.log("user_roles res:", urRes.error || `count: ${urRes.data?.length}`);

  console.log("--- Testing teacher_profiles ---");
  const tpRes = await supabase.from("teacher_profiles").select("*");
  console.log("teacher_profiles res:", tpRes.error || `count: ${tpRes.data?.length}`);
}

testQueries();

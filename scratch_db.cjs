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

console.log("URL:", url);
const supabase = createClient(url, key);

async function inspectProfiles() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  console.log("Total profiles:", data.length);
  
  const statusCounts = {};
  data.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  console.log("Status distribution:", statusCounts);

  const roleCounts = {};
  data.forEach(p => {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  });
  console.log("Role distribution:", roleCounts);

  console.log("Sample 3 profiles:", JSON.stringify(data.slice(0, 3), null, 2));
}

inspectProfiles();

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

async function run() {
  console.log("Signing up...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: "ysds@example.com", // fake email if username is 'ysds'
    password: "ysds123",
    options: {
      data: {
        username: "ysds",
        full_name: "Yayasan",
        role: "admin 2"
      }
    }
  });

  if (authError) {
    console.error("Sign up error:", authError.message);
    return;
  }
  
  console.log("Sign up successful. User:", authData.user?.id);
  
  // Try to update profile if needed
  if (authData.user) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin 2', username: 'ysds' })
      .eq('user_id', authData.user.id);
      
    if (profileError) {
      console.error("Error updating profile:", profileError.message);
    } else {
      console.log("Profile updated successfully!");
    }
  }
}

run();

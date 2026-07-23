const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const envContent = fs.readFileSync(".env_utf8", "utf8");
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim().replace(/^\uFEFF/, '')] = match[2].trim();
  }
});

const projectId = envVars.VITE_SUPABASE_PROJECT_ID?.replace(/['"\r]/g, '')?.trim();
const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : envVars.VITE_SUPABASE_URL?.replace(/['"\r]/g, '')?.trim();
const supabaseKey = (envVars.VITE_SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_ANON_KEY)?.replace(/['"\r]/g, '')?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log(`Profiles: ${data?.length}`);
  
  // What if there's a table called evaluators? (we saw it was null)
  // What about any other table? I'll just check if profiles has some data that looks like teacher profiles
  const teachers = data.filter(p => p.role === 'teacher' || p.role === 'admin');
  console.log(`Teachers in profiles: ${teachers.length}`);
  const withWhatsapp = teachers.filter(p => p.whatsapp).length;
  console.log(`Teachers with whatsapp in profiles: ${withWhatsapp}`);
  
  // Maybe they meant there is a json file? Or maybe they mean something else.
  // Is there any table named 'guru' or 'teachers'?
  const { data: teachersData } = await supabase.from('teachers').select('*').limit(1);
  console.log('teachers table:', !!teachersData);
}
checkAll();

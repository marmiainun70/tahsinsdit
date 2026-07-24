const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const envContent = fs.readFileSync(".env", "utf8");
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim().replace(/^\uFEFF/, '')] = match[2].trim().replace(/['"\r]/g, '');
  }
});

const projectId = envVars.VITE_SUPABASE_PROJECT_ID;
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudent() {
  const { data: students, error: err1 } = await supabase.from('students').select('*').limit(100);
  console.log("Students sample:");
  students.forEach(s => console.log(s.nama, s.kelas, s.rombel));
}
checkStudent();

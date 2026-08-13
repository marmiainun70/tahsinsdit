const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const envContent = fs.readFileSync('.env', 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k] = v.replace(/"/g, '').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function findMismatches() {
  console.log("Mengambil data laporan bulanan...");
  
  const { data: reports, error: err1 } = await supabase
    .from('monthly_reports')
    .select('id, student_id, month, year, nilai_akhir_progresif, notes');
    
  if (err1) {
    console.error("Error fetching reports:", err1);
    return;
  }
  
  console.log("Total reports fetched:", reports.length);
}

findMismatches();

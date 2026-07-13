const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching students from Supabase...");
  const { data: dbStudents, error } = await supabase.from('students').select('*').eq('status_siswa', 'aktif');
  if (error) {
    console.error("Error fetching DB:", error);
    return;
  }
  console.log(`Fetched ${dbStudents.length} active students from DB.`);

  console.log("Parsing markdown file...");
  const mdContent = fs.readFileSync('c:\\Users\\ASUS\\Downloads\\DATA_KELAS_NIS_SISWA_TP_2026_2027.md', 'utf-8');
  
  const mdStudents = [];
  const lines = mdContent.split('\n');

  for (const line of lines) {
    if (line.startsWith('|') && !line.includes('---') && !line.includes('No | Nama')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const no = parts[1];
        const nama = parts[2];
        const nipd = parts[3]; 
        
        if (no && !isNaN(no)) {
          mdStudents.push({ nama, nis: nipd });
        }
      }
    }
  }
  
  console.log(`Parsed ${mdStudents.length} students from Markdown.`);
  
  // Create quick lookup maps for MD students
  const mdByNis = new Map();
  const mdByName = new Map(); // Using normalized name
  
  const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  mdStudents.forEach(s => {
    if (s.nis) mdByNis.set(s.nis, s);
    mdByName.set(normalizeName(s.nama), s);
  });
  
  const toUpdateToAlumni = [];
  
  // Find students in DB not in MD
  for (const dbS of dbStudents) {
    let found = false;
    
    // Check by NIS
    if (dbS.nis && mdByNis.has(dbS.nis)) {
      found = true;
    }
    
    // Check by Name
    if (!found) {
      const dbNormName = normalizeName(dbS.nama);
      if (mdByName.has(dbNormName)) {
        found = true;
      }
    }

    if (!found) {
        toUpdateToAlumni.push(dbS);
    }
  }
  
  console.log(`Found ${toUpdateToAlumni.length} students to mark as alumni.`);
  
  // Output a sql script in scratch to let user run it safely instead of executing immediately
  const sqlStatements = toUpdateToAlumni.map(s => `UPDATE public.students SET status_siswa = 'alumni', tahun_lulus = '2026' WHERE id = '${s.id}'; -- ${s.nama} (${s.kelas})`).join('\n');
  
  fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\7508eb7d-0ccd-48d5-aeca-f04fb2343e42\\update_alumni.sql', sqlStatements);
  console.log("SQL script to update alumni saved to artifact update_alumni.sql");
}

run();

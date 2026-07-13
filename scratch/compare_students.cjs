const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envContent = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching students from Supabase...");
  const { data: dbStudents, error } = await supabase.from('students').select('*');
  if (error) {
    console.error("Error fetching DB:", error);
    return;
  }
  console.log(`Fetched ${dbStudents.length} students from DB.`);

  console.log("Parsing markdown file...");
  const mdContent = fs.readFileSync('c:\\Users\\ASUS\\Downloads\\DATA_KELAS_NIS_SISWA_TP_2026_2027.md', 'utf-8');
  
  const mdStudents = [];
  const lines = mdContent.split('\n');
  let currentClass = "";
  let currentRombel = "";

  for (const line of lines) {
    if (line.startsWith('## Kelas')) {
      // e.g. ## Kelas I - A
      const match = line.match(/## Kelas (I|II|III|IV|V|VI) - ([A-D])/);
      if (match) {
        currentClass = parseRoman(match[1]);
        currentRombel = match[2];
      }
    } else if (line.startsWith('|') && !line.includes('---') && !line.includes('No | Nama')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const no = parts[1];
        const nama = parts[2];
        const nipd = parts[3]; // nipd is what we call nis?
        const jk = parts[4];
        const nisn = parts[5];
        
        if (no && !isNaN(no)) {
          mdStudents.push({
            nama,
            nis: nipd,
            nisn: nisn || null,
            kelas: currentClass,
            rombel: currentRombel,
            jk
          });
        }
      }
    }
  }
  
  console.log(`Parsed ${mdStudents.length} students from Markdown.`);
  
  const dbByNis = new Map();
  dbStudents.forEach(s => dbByNis.set(s.nis, s));
  
  const mdByNis = new Map();
  mdStudents.forEach(s => mdByNis.set(s.nis, s));
  
  const missingInDb = [];
  const missingInMd = [];
  const differences = [];
  
  // Check MD against DB
  for (const mdS of mdStudents) {
    const dbS = dbByNis.get(mdS.nis);
    if (!dbS) {
      missingInDb.push(mdS);
    } else {
      let diff = [];
      if (dbS.kelas !== mdS.kelas) diff.push(`Kelas DB:${dbS.kelas} != MD:${mdS.kelas}`);
      if (dbS.rombel !== mdS.rombel) diff.push(`Rombel DB:${dbS.rombel} != MD:${mdS.rombel}`);
      if (dbS.nama.trim().toUpperCase() !== mdS.nama.trim().toUpperCase()) diff.push(`Nama DB:"${dbS.nama}" != MD:"${mdS.nama}"`);
      
      if (diff.length > 0) {
        differences.push({ nis: mdS.nis, nama: mdS.nama, diffs: diff });
      }
    }
  }
  
  // Check DB against MD
  for (const dbS of dbStudents) {
    if (!mdByNis.has(dbS.nis)) {
      missingInMd.push(dbS);
    }
  }
  
  const report = `
# Laporan Perbandingan Data Siswa

## Ringkasan
- Total di Database: ${dbStudents.length}
- Total di File MD: ${mdStudents.length}

## 1. Siswa di File MD tapi TIDAK ADA di Database (${missingInDb.length})
${missingInDb.length === 0 ? "Tidak ada" : missingInDb.map(s => `- NIS: ${s.nis} | Nama: ${s.nama} | Kelas: ${s.kelas} ${s.rombel}`).join('\n')}

## 2. Siswa di Database tapi TIDAK ADA di File MD (${missingInMd.length})
${missingInMd.length === 0 ? "Tidak ada" : missingInMd.map(s => `- NIS: ${s.nis} | Nama: ${s.nama} | Kelas: ${s.kelas} ${s.rombel}`).join('\n')}

## 3. Perbedaan Data (Kelas/Rombel/Nama) (${differences.length})
${differences.length === 0 ? "Tidak ada" : differences.map(d => `- NIS: ${d.nis} | ${d.nama}\n  Perbedaan: ${d.diffs.join(', ')}`).join('\n')}
`;

  fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\7508eb7d-0ccd-48d5-aeca-f04fb2343e42\\student_comparison.md', report);
  console.log("Comparison saved to artifact.");
}

function parseRoman(r) {
  switch(r) {
    case 'I': return 1;
    case 'II': return 2;
    case 'III': return 3;
    case 'IV': return 4;
    case 'V': return 5;
    case 'VI': return 6;
    default: return 0;
  }
}

run();

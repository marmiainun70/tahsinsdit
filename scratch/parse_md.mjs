import fs from 'fs';

const inputFile = 'c:\\Users\\ASUS\\OneDrive\\Desktop\\SDIT LUQMANUL HAKIM\\Tahfizh sdit luqman\\Database siswa tahfizh\\data_siswa_2026-06-22.md';
const outputFile = 'update_kelas.sql';

const content = fs.readFileSync(inputFile, 'utf-8');
const blocks = content.split(/\n\s*\n/); // Split by empty lines

const updates = [];

for (const block of blocks) {
  // Skip headers or unrelated blocks
  if (block.includes('---') || block.includes('Nama') || block.trim() === '' || block.includes('# Data Siswa')) continue;

  const lines = block.split('\n');
  if (lines.length < 2) continue; // Normally it's 2 lines

  const line1 = lines[0];
  const line2 = lines[1];

  // NIS is usually a number before NISN
  // e.g., "  Abdul Aziz Syahreza Sinurat    740   0137796003 Kelas   aktif       Tahsin"
  // Match NIS: finding digits followed by space and then another set of digits (NISN)
  const match1 = line1.match(/(\d+)\s+\d+\s+Kelas/);
  if (!match1) {
    // some might not match this exactly if NISN is missing, etc. let's be more robust
    // Or just look for 6A in line 2
  }
  
  // Let's use a simpler approach:
  // line 1 contains NIS and NISN
  // line 2 contains the class e.g., "6A"
  
  // Extract NIS: it's the sequence of digits right before a longer sequence of digits (NISN)
  // Let's just grab all numbers in line 1
  const numbersInLine1 = line1.match(/\b\d+\b/g);
  if (!numbersInLine1 || numbersInLine1.length < 1) continue;
  
  const nis = numbersInLine1[0]; // first number is usually NIS
  
  // Extract class from line 2
  // e.g. "                                                  6A                  Lanjutan"
  // look for a digit followed by a letter e.g., 6A
  const classMatch = line2.match(/\b(\d)([A-Z])\b/);
  if (classMatch) {
    const kelas = classMatch[1];
    const rombel = classMatch[2];
    updates.push(`UPDATE public.students SET kelas = ${kelas}, rombel = '${rombel}', status_siswa = 'aktif', tahun_lulus = NULL, updated_at = now() WHERE nis = '${nis}';`);
  }
}

fs.writeFileSync(outputFile, updates.join('\n') + '\n');
console.log(`Generated ${updates.length} SQL update statements in ${outputFile}`);

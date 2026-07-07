const fs = require('fs');

const inputFile = "c:\\\\Users\\\\ASUS\\\\OneDrive\\\\Desktop\\\\SDIT LUQMANUL HAKIM\\\\Tahfizh sdit luqman\\\\Database siswa tahfizh\\\\kelas_1.md";
const outputFile = "c:\\\\Users\\\\ASUS\\\\OneDrive\\\\Documents\\\\github tahsin\\\\tahsinsdit\\\\insert_kelas_1.sql";

const data = fs.readFileSync(inputFile, 'utf8');

let sql = "BEGIN;\n\n";
let currentRombel = null;

const lines = data.split('\n');
for (const line of lines) {
    const rombelMatch = line.match(/# KELAS I - ([A-D])/);
    if (rombelMatch) {
        currentRombel = rombelMatch[1];
        continue;
    }
    
    const studentMatch = line.match(/^\s*\d+\s+(.+)$/);
    if (studentMatch && currentRombel) {
        let nama = studentMatch[1].trim();
        if (nama.includes("Nama Siswa") || nama.includes("----")) {
            continue;
        }
        const namaEscaped = nama.replace(/'/g, "''");
        sql += `INSERT INTO public.students (nama, kelas, rombel, level, halaman_terakhir, status_bacaan, status_siswa) VALUES ('${namaEscaped}', 1, '${currentRombel}', 'Iqro 1', 0, 'Lancar', 'aktif');\n`;
    }
}

sql += "\nCOMMIT;\n";

fs.writeFileSync(outputFile, sql, 'utf8');
console.log(`Generated ${outputFile} successfully.`);

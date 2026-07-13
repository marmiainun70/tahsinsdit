const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => { 
  const [k, ...vParts] = line.split('=');
  const v = vParts.join('=');
  if(k && v) acc[k.trim()] = v.trim().replace(/"/g, ''); 
  return acc; 
}, {}); 

const dataStr = fs.readFileSync(path.join(__dirname, '../bank_soal_makhraj_sifat.json'), 'utf8');
const data = JSON.parse(dataStr);

const recordsToInsert = data.soal.map(record => {
  return {
    id: record.uuid,
    kategori: record.kategori.trim(),
    sub_aspek: record.sub_aspek.trim(),
    tipe_soal: record.tipe_soal.trim(),
    level_kognitif: record.level_kognitif.trim(),
    tingkat_kesulitan: record.tingkat_kesulitan.trim(),
    indikator_kompetensi: record.indikator_kompetensi.trim(),
    soal: record.soal.trim(),
    opsi_a: record.pilihan?.A?.trim() ?? null,
    opsi_b: record.pilihan?.B?.trim() ?? null,
    opsi_c: record.pilihan?.C?.trim() ?? null,
    opsi_d: record.pilihan?.D?.trim() ?? null,
    jawaban_benar: record.kunci_jawaban.trim().toUpperCase(),
    pembahasan: "", // We don't have pembahasan in this dataset
    bobot: 1,
    aktif: true
  };
});

const chunkSize = 15;
for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
  const chunk = recordsToInsert.slice(i, i + chunkSize);
  const sqlLines = ["INSERT INTO public.bank_soal (id, kategori, sub_aspek, tipe_soal, level_kognitif, tingkat_kesulitan, indikator_kompetensi, soal, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, pembahasan, bobot, aktif) VALUES"];
  const values = chunk.map(r => {
    const escapeSql = (str) => {
      if (str === null || str === undefined) return 'NULL';
      return "'" + str.replace(/'/g, "''") + "'";
    };
    return `(
      ${escapeSql(r.id)},
      ${escapeSql(r.kategori)},
      ${escapeSql(r.sub_aspek)},
      ${escapeSql(r.tipe_soal)},
      ${escapeSql(r.level_kognitif)},
      ${escapeSql(r.tingkat_kesulitan)},
      ${escapeSql(r.indikator_kompetensi)},
      ${escapeSql(r.soal)},
      ${escapeSql(r.opsi_a)},
      ${escapeSql(r.opsi_b)},
      ${escapeSql(r.opsi_c)},
      ${escapeSql(r.opsi_d)},
      ${escapeSql(r.jawaban_benar)},
      ${escapeSql(r.pembahasan)},
      ${r.bobot},
      ${r.aktif}
    )`;
  });
  
  sqlLines.push(values.join(',\n') + ';');
  const partNum = Math.floor(i / chunkSize) + 1;
  const outPath = path.join(__dirname, `insert_makhraj_sifat_part${partNum}.sql`);
  fs.writeFileSync(outPath, sqlLines.join('\n'));
  console.log(`SQL generated di tahsinsdit/insert_makhraj_sifat_part${partNum}.sql`);
}

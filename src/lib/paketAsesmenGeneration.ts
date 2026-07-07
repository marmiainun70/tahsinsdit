export type SoalBankRow = {
  id: string;
  kategori: string;
  sub_aspek: string;
  tingkat_kesulitan: string;
  tipe_soal: string;
  aktif: boolean;
};

export type SoalPaketFilter = {
  kategori?: string;
  subAspek?: string;
  tingkatKesulitan?: string;
  tipeSoal?: string;
};

export function shuffleArray<T>(items: T[], rng: () => number = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectSoalForPaket(
  bankSoalRows: SoalBankRow[],
  existingSoalIds: Set<string>,
  filters: SoalPaketFilter,
  jumlahSoal: number,
  rng: () => number = Math.random,
) {
  // 1. Filter soal yang memenuhi kriteria awal
  const eligible = bankSoalRows.filter((row) => {
    if (!row.aktif) return false;
    if (existingSoalIds.has(row.id)) return false;
    if (filters.kategori) {
      if (filters.kategori === 'Tahsin Dasar' && !['Tahsin Dasar', 'Makhraj'].includes(row.kategori)) return false;
      else if (filters.kategori === 'Tahsin Lanjutan' && !['Tahsin Lanjutan', 'Tajwid', 'Tajwid Lanjutan'].includes(row.kategori)) return false;
      else if (filters.kategori === 'Tahfizh' && !['Tahfizh', 'Metodologi Tahfizh'].includes(row.kategori)) return false;
      else if (!['Tahsin Dasar', 'Tahsin Lanjutan', 'Tahfizh'].includes(filters.kategori) && row.kategori !== filters.kategori) return false;
    }
    if (filters.subAspek && row.sub_aspek !== filters.subAspek) return false;
    if (filters.tingkatKesulitan && row.tingkat_kesulitan !== filters.tingkatKesulitan) return false;
    if (filters.tipeSoal && filters.tipeSoal !== "all" && row.tipe_soal !== filters.tipeSoal) return false;
    return true;
  });

  if (jumlahSoal <= 0) return [];
  if (eligible.length <= jumlahSoal) return shuffleArray(eligible, rng);

  // 2. Kelompokkan soal ke dalam 'buckets' berdasarkan Kategori dan Kesulitan (jika tidak difilter)
  // Tujuannya agar pembagian soal adil merata antar kategori dan tingkat kesulitan
  const getBucketKey = (row: SoalBankRow) => {
    const parts = [];
    if (!filters.kategori) parts.push(`cat:${row.kategori}`);
    if (!filters.tingkatKesulitan) parts.push(`diff:${row.tingkat_kesulitan}`);
    return parts.length > 0 ? parts.join('|') : 'all';
  };

  const buckets = new Map<string, SoalBankRow[]>();
  for (const row of eligible) {
    const key = getBucketKey(row);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(row);
  }

  // 3. Acak soal di dalam masing-masing bucket
  for (const key of buckets.keys()) {
    buckets.set(key, shuffleArray(buckets.get(key)!, rng));
  }

  // 4. Ambil soal secara bergiliran (Round Robin) dari setiap bucket agar adil
  const result: SoalBankRow[] = [];
  let remainingToPick = jumlahSoal;
  const activeBuckets = Array.from(buckets.values()).filter(b => b.length > 0);

  while (remainingToPick > 0 && activeBuckets.length > 0) {
    // Hitung jatah rata-rata per bucket pada putaran ini
    const pickPerBucket = Math.max(1, Math.floor(remainingToPick / activeBuckets.length));
    let pickedInThisRound = 0;

    for (let i = activeBuckets.length - 1; i >= 0; i--) {
      const bucket = activeBuckets[i];
      const toPick = Math.min(pickPerBucket, bucket.length);
      
      const picked = bucket.splice(0, toPick);
      result.push(...picked);
      
      remainingToPick -= picked.length;
      pickedInThisRound += picked.length;

      // Hapus bucket jika sudah kosong
      if (bucket.length === 0) {
        activeBuckets.splice(i, 1);
      }

      if (remainingToPick <= 0) break;
    }

    if (pickedInThisRound === 0) break; // Fallback anti infinite-loop
  }

  // 5. Acak hasil akhir agar susunannya tidak mengelompok berdasarkan bucket
  return shuffleArray(result, rng);
}

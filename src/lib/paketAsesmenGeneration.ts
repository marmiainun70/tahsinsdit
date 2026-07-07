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
  const eligible = bankSoalRows.filter((row) => {
    if (!row.aktif) return false;
    if (existingSoalIds.has(row.id)) return false;
    if (filters.kategori && row.kategori !== filters.kategori) return false;
    if (filters.subAspek && row.sub_aspek !== filters.subAspek) return false;
    if (filters.tingkatKesulitan && row.tingkat_kesulitan !== filters.tingkatKesulitan) return false;
    if (filters.tipeSoal && filters.tipeSoal !== "all" && row.tipe_soal !== filters.tipeSoal) return false;
    return true;
  });

  return shuffleArray(eligible, rng).slice(0, jumlahSoal);
}

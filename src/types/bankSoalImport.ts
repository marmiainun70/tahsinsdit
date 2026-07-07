export type BankSoalImportPilihan = {
  A: string;
  B: string;
  C: string;
  D: string;
};

export type BankSoalImportRecord = {
  id_soal: string;
  uuid: string;
  versi: string;
  kategori: string;
  sub_aspek: string;
  tipe_soal: string;
  level_kognitif: string;
  tingkat_kesulitan: string;
  indikator_kompetensi: string;
  soal: string;
  pilihan?: BankSoalImportPilihan | null;
  jawaban_benar: string;
  pembahasan?: string | null;
  rubrik_penilaian?: string | null;
  bobot?: number;
  aktif?: boolean;
};

export type BankSoalImportRow = BankSoalImportRecord & {
  rowNumber: number;
  isReflective: boolean;
  valid: boolean;
  errors: string[];
  normalizedSoal: string;
};

export type BankSoalImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  pg: number;
  reflektif: number;
  duplicateQuestionCount: number;
  answerDistribution: Record<"A" | "B" | "C" | "D", number>;
};

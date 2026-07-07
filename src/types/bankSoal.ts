export type BankSoal = {
  id: string;
  kategori: string;
  sub_aspek: string;
  tipe_soal: string;
  level_kognitif: string;
  tingkat_kesulitan: string;
  indikator_kompetensi: string;
  soal: string;
  opsi_a: string | null;
  opsi_b: string | null;
  opsi_c: string | null;
  opsi_d: string | null;
  jawaban_benar: string;
  pembahasan: string | null;
  bobot: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
};

export type BankSoalInput = Omit<BankSoal, 'id' | 'created_at' | 'updated_at'>;

export type BankSoalFilter = {
  kategori?: string;
  sub_aspek?: string;
  tingkat_kesulitan?: string;
  level_kognitif?: string;
  search?: string;
};

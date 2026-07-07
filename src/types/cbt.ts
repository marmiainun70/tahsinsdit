export type AsesmenSession = {
  id: string;
  peserta_asesmen_id: string;
  started_at: string;
  finished_at: string | null;
  remaining_time: number | null;
  last_question: number;
  status: 'Aktif' | 'Selesai';
  created_at: string;
};

export type AsesmenJawaban = {
  id: string;
  session_id: string;
  soal_id: string;
  jawaban: string | null;
  benar: boolean | null;
  skor: number | null;
  answered_at: string;
};

export type SoalCBT = {
  id: string;
  soal: string;
  tipe_soal: string;
  opsi_a: string | null;
  opsi_b: string | null;
  opsi_c: string | null;
  opsi_d: string | null;
};

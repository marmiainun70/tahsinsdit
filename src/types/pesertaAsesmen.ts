export type PesertaAsesmen = {
  id: string;
  paket_id: string;
  guru_id: string;
  status: 'Belum Mulai' | 'Sedang Mengerjakan' | 'Selesai';
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  nilai_akhir: number | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
};

export type PesertaAsesmenDetail = Omit<PesertaAsesmen, 'updated_at'> & {
  nama_guru: string;
};

export type PesertaAsesmenInput = Omit<PesertaAsesmen, 'id' | 'created_at' | 'updated_at' | 'status' | 'waktu_mulai' | 'waktu_selesai' | 'nilai_akhir' | 'catatan'> & {
  status?: 'Belum Mulai' | 'Sedang Mengerjakan' | 'Selesai';
  catatan?: string | null;
};

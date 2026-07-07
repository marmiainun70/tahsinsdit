export type PaketAsesmen = {
  id: string;
  nama_paket: string;
  kode_paket: string;
  jenis_asesmen: string;
  periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi_menit: number;
  nilai_minimum: number;
  status: 'Draft' | 'Aktif' | 'Selesai';
  jumlah_soal: number;
  acak_soal: boolean;
  acak_opsi: boolean;
  kategori_kompetensi: string[];
  created_at: string;
  updated_at: string;
};

export type PaketAsesmenInput = Omit<PaketAsesmen, 'id' | 'created_at' | 'updated_at'>;

export type PaketAsesmenFilter = {
  jenis_asesmen?: string;
  status?: string;
  search?: string;
};

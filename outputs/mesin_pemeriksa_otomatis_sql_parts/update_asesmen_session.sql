-- Update tabel asesmen_session untuk menyimpan hasil pemeriksaan ujian
ALTER TABLE asesmen_session
ADD COLUMN IF NOT EXISTS total_soal integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_benar integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_salah integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nilai numeric(5,2) DEFAULT 0.00;

-- Migration 1A: Lifecycle Siswa
-- Menambahkan field untuk mendukung siklus hidup siswa secara penuh:
-- aktif → alumni / keluar / pindah

-- 1. Buat enum status_siswa
CREATE TYPE public.student_status AS ENUM (
  'aktif',
  'alumni',
  'keluar',
  'pindah'
);

-- 2. Tambah kolom lifecycle ke tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS status_siswa public.student_status NOT NULL DEFAULT 'aktif',
  ADD COLUMN IF NOT EXISTS tahun_lulus INTEGER,
  ADD COLUMN IF NOT EXISTS tanggal_keluar DATE,
  ADD COLUMN IF NOT EXISTS alasan_keluar TEXT;

-- 3. Index untuk filter status (sering dipakai di Monitoring & Rekap)
CREATE INDEX IF NOT EXISTS idx_students_status_siswa
  ON public.students(status_siswa);

-- 4. Index gabungan untuk filter aktif per kelas (query Dashboard)
CREATE INDEX IF NOT EXISTS idx_students_kelas_status
  ON public.students(kelas, status_siswa);

-- 5. Constraint: tahun_lulus hanya boleh diisi jika status_siswa = 'alumni'
ALTER TABLE public.students
  ADD CONSTRAINT check_tahun_lulus_alumni
    CHECK (tahun_lulus IS NULL OR status_siswa = 'alumni');

-- 6. Backfill: semua siswa existing dianggap aktif (sudah default via DEFAULT 'aktif')
-- Tidak diperlukan UPDATE manual karena DEFAULT sudah menangani ini.

-- 7. Tambah activity_type baru untuk event transisi
--    (dilakukan di migration terpisah karena ALTER TYPE ADD VALUE tidak bisa di dalam
--     transaksi yang sama dengan DDL lain di beberapa versi Postgres)

-- Tambah kolom rombel ke tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS rombel TEXT NOT NULL DEFAULT 'A'
    CHECK (rombel IN ('A', 'B', 'C', 'D'));

-- Index untuk query cepat per kelas+rombel
CREATE INDEX IF NOT EXISTS idx_students_kelas_rombel ON public.students(kelas, rombel);
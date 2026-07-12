-- Hapus tabel lama (karena ini masih fitur baru dan belum ada data production yang riil, aman untuk drop and recreate)
DROP TABLE IF EXISTS public.diagnostic_evaluations;

-- Buat tipe ENUM baru jika belum ada
DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM ('belum_dievaluasi', 'sudah_dievaluasi', 'perlu_evaluasi_ulang');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE diagnostic_level_awal AS ENUM ('belum_bisa_baca', 'iqro_1', 'iqro_2', 'iqro_3', 'iqro_4', 'iqro_5', 'iqro_6', 'tahsin_lanjutan', 'tahfizh');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tajwid_skor AS ENUM ('belum', 'mulai', 'baik', 'menguasai');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Buat ulang tabel sesuai spec MVP
CREATE TABLE public.diagnostic_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES auth.users(id),
    evaluated_at TIMESTAMPTZ,
    status evaluation_status NOT NULL DEFAULT 'belum_dievaluasi',
    
    -- Level Awal
    level_awal diagnostic_level_awal,

    -- Aspek Bacaan (Tahsin MVP)
    kelancaran_membaca INTEGER CHECK (kelancaran_membaca BETWEEN 1 AND 5),
    makharijul_huruf INTEGER CHECK (makharijul_huruf BETWEEN 1 AND 5),
    tajwid_dasar_materi JSONB DEFAULT '{"mad_thabii": false, "qalqalah": false, "nun_mati_tanwin": false, "mim_mati": false, "ghunnah": false, "lam_tarif": false}'::jsonb,
    tajwid_dasar_skor tajwid_skor,

    -- Aspek Fase 2 (disiapkan agar tidak perlu migrasi skema nanti)
    sifat_huruf INTEGER CHECK (sifat_huruf BETWEEN 1 AND 5),
    waqaf_ibtida TEXT,
    tahfizh_juz INTEGER,
    tahfizh_surat TEXT,
    tahfizh_ayat_range TEXT,
    tahfizh_kelancaran TEXT,
    tahfizh_lahn_jali_count INTEGER DEFAULT 0,
    tahfizh_lahn_khofi_count INTEGER DEFAULT 0,
    tahfizh_salah_sambung_count INTEGER DEFAULT 0,
    nilai_tahfizh NUMERIC,

    -- Kesimpulan Otomatis (MVP)
    hasil_kemampuan TEXT,
    rekomendasi TEXT,

    -- Catatan
    catatan_penguji TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_diagnostic_student_academic_year UNIQUE (student_id, academic_year_id)
);

-- Trigger updated_at
CREATE TRIGGER update_diagnostic_evaluations_updated_at
BEFORE UPDATE ON public.diagnostic_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.diagnostic_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view diagnostic evaluations"
  ON public.diagnostic_evaluations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert diagnostic evaluations"
  ON public.diagnostic_evaluations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update diagnostic evaluations"
  ON public.diagnostic_evaluations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete diagnostic evaluations"
  ON public.diagnostic_evaluations FOR DELETE TO authenticated USING (true);

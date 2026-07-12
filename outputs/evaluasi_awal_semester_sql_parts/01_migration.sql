-- 1. Drop old tables if exist
DROP TABLE IF EXISTS public.teacher_profiles_diagnostics CASCADE;
DROP TABLE IF EXISTS public.diagnostic_evaluations CASCADE;

-- 2. Master Table: master_level_kemampuan
CREATE TABLE IF NOT EXISTS public.master_level_kemampuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_level VARCHAR(50) UNIQUE NOT NULL,
    nama_level VARCHAR(100) NOT NULL,
    program_nama VARCHAR(100) NOT NULL,
    poin_ibp_dasar INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed exactly 8 rows
INSERT INTO public.master_level_kemampuan (kode_level, nama_level, program_nama, poin_ibp_dasar) VALUES
('LEVEL_1_1', 'Iqro 1', 'Tahsin Dasar', 10),
('LEVEL_1_2', 'Iqro 2', 'Tahsin Dasar', 9),
('LEVEL_1_3', 'Iqro 3', 'Tahsin Dasar', 8),
('LEVEL_1_4', 'Iqro 4', 'Tahsin Dasar', 7),
('LEVEL_1_5', 'Iqro 5', 'Tahsin Dasar', 6),
('LEVEL_1_6', 'Iqro 6', 'Tahsin Dasar', 5),
('LEVEL_2', 'Menengah', 'Tahsin Lanjutan', 4),
('LEVEL_3', 'Unggul', 'Tahfizh', 3)
ON CONFLICT (kode_level) DO UPDATE 
SET nama_level = EXCLUDED.nama_level,
    program_nama = EXCLUDED.program_nama,
    poin_ibp_dasar = EXCLUDED.poin_ibp_dasar;

-- 3. Core Table: evaluasi_awal_semester
CREATE TABLE IF NOT EXISTS public.evaluasi_awal_semester (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    final_score INT NOT NULL,
    final_predicate VARCHAR(50),
    selected_level_id UUID REFERENCES public.master_level_kemampuan(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Child Tables
CREATE TABLE IF NOT EXISTS public.evaluasi_profil_awal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    jawaban JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.evaluasi_kelancaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    score INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.evaluasi_kesalahan_bacaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    lahn_jali_count INT NOT NULL DEFAULT 0,
    lahn_khofi_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.evaluasi_makharij (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.evaluasi_tajwid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.evaluasi_waqaf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    error_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.evaluasi_tahfizh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    salah_sambung_ayat_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.evaluasi_rekomendasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluasi_id UUID NOT NULL UNIQUE REFERENCES public.evaluasi_awal_semester(id) ON DELETE CASCADE,
    fokus_pembinaan TEXT[] NOT NULL DEFAULT '{}',
    recommended_level_id UUID REFERENCES public.master_level_kemampuan(id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE public.master_level_kemampuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_awal_semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_profil_awal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_kelancaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_kesalahan_bacaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_makharij ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_tajwid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_waqaf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_tahfizh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluasi_rekomendasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read master_level_kemampuan" ON public.master_level_kemampuan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all evaluasi_awal_semester" ON public.evaluasi_awal_semester FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_profil_awal" ON public.evaluasi_profil_awal FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_kelancaran" ON public.evaluasi_kelancaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_kesalahan_bacaan" ON public.evaluasi_kesalahan_bacaan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_makharij" ON public.evaluasi_makharij FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_tajwid" ON public.evaluasi_tajwid FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_waqaf" ON public.evaluasi_waqaf FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_tahfizh" ON public.evaluasi_tahfizh FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all evaluasi_rekomendasi" ON public.evaluasi_rekomendasi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migration 1B: Extend academic_years dengan kolom transisi
-- Menambahkan tracking status proses kenaikan tahun ajaran

-- 1. Buat enum transition_status (terpisah dari status tahun ajaran)
CREATE TYPE public.transition_status AS ENUM (
  'draft',
  'waiting',
  'processing',
  'completed',
  'failed'
);

-- 2. Extend tabel academic_years
ALTER TABLE public.academic_years
  ADD COLUMN IF NOT EXISTS transition_status public.transition_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS transition_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transition_processed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS transition_notes TEXT;

-- 3. Index untuk query status transisi
CREATE INDEX IF NOT EXISTS idx_academic_years_transition_status
  ON public.academic_years(transition_status);

-- 4. Index untuk query combined: status aktif + transition belum selesai (dipakai Dashboard Alert)
CREATE INDEX IF NOT EXISTS idx_academic_years_status_transition
  ON public.academic_years(status, transition_status);

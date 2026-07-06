-- Migration 1C: Tabel academic_year_transitions
-- Menyimpan riwayat lengkap setiap proses kenaikan tahun ajaran
-- sebagai audit trail & transition history

CREATE TABLE IF NOT EXISTS public.academic_year_transitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  processed_by     UUID NOT NULL REFERENCES auth.users(id),
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms      INTEGER,                    -- durasi proses dalam milidetik
  total_students   INTEGER NOT NULL DEFAULT 0,
  total_naik       INTEGER NOT NULL DEFAULT 0,
  total_alumni     INTEGER NOT NULL DEFAULT 0,
  total_gagal      INTEGER NOT NULL DEFAULT 0,
  status           public.transition_status NOT NULL DEFAULT 'processing',
  class_mapping    JSONB NOT NULL DEFAULT '[]', -- snapshot mapping kelas yang digunakan
  teacher_action   TEXT NOT NULL DEFAULT 'kosongkan'
                     CHECK (teacher_action IN ('pertahankan', 'kosongkan', 'baru')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.academic_year_transitions ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa membaca riwayat transisi
CREATE POLICY "Admin can read transitions"
  ON public.academic_year_transitions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert dilakukan oleh RPC (SECURITY DEFINER), bukan langsung oleh user
-- Policy ini memungkinkan RPC menulis saat dipanggil oleh admin
CREATE POLICY "Admin can insert transitions"
  ON public.academic_year_transitions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update transitions"
  ON public.academic_year_transitions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transitions_academic_year
  ON public.academic_year_transitions(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_transitions_processed_at
  ON public.academic_year_transitions(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_transitions_status
  ON public.academic_year_transitions(status);

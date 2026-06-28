CREATE OR REPLACE FUNCTION public.is_teacher_diagnostic_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = _user_id
        AND lower(COALESCE(p.role, '')) IN ('admin', 'koordinator', 'coordinator')
    ),
    false
  );
$$;

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gender text,
  birth_place text,
  birth_date date,
  phone text,
  address text,
  last_education text,
  tahsin_background text,
  certificates text,
  teaching_experience text,
  teaching_start_year integer,
  previous_classes text,
  current_classes text,
  specialization text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_profiles_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id uuid NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  evaluator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  test_material text,
  makhraj_score numeric(5,2) NOT NULL DEFAULT 0,
  sifat_score numeric(5,2) NOT NULL DEFAULT 0,
  tajwid_score numeric(5,2) NOT NULL DEFAULT 0,
  waqaf_ibtida_score numeric(5,2) NOT NULL DEFAULT 0,
  fluency_score numeric(5,2) NOT NULL DEFAULT 0,
  teaching_readiness_score numeric(5,2) NOT NULL DEFAULT 0,
  mapping_score numeric(5,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Pembinaan Intensif',
  strengths_note text,
  improvement_note text,
  coaching_recommendation text,
  placement_recommendation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_diagnostics_makhraj_score_check CHECK (makhraj_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_sifat_score_check CHECK (sifat_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_tajwid_score_check CHECK (tajwid_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_waqaf_ibtida_score_check CHECK (waqaf_ibtida_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_fluency_score_check CHECK (fluency_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_teaching_readiness_score_check CHECK (teaching_readiness_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_mapping_score_check CHECK (mapping_score BETWEEN 0 AND 100),
  CONSTRAINT teacher_diagnostics_category_check CHECK (
    category IN ('Sangat Siap', 'Siap', 'Cukup Siap', 'Perlu Pembinaan', 'Pembinaan Intensif')
  )
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON public.teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_diagnostics_teacher_date ON public.teacher_diagnostics(teacher_profile_id, evaluation_date DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_teacher_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teacher_profiles_set_updated_at ON public.teacher_profiles;
CREATE TRIGGER teacher_profiles_set_updated_at
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_teacher_profile_updated_at();

CREATE OR REPLACE FUNCTION public.prepare_teacher_diagnostic()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score numeric(5,2);
BEGIN
  v_score := round((
    NEW.makhraj_score
    + NEW.sifat_score
    + NEW.tajwid_score
    + NEW.waqaf_ibtida_score
    + NEW.fluency_score
    + NEW.teaching_readiness_score
  ) / 6.0, 2);

  NEW.mapping_score = v_score;
  NEW.category = CASE
    WHEN v_score >= 90 THEN 'Sangat Siap'
    WHEN v_score >= 80 THEN 'Siap'
    WHEN v_score >= 70 THEN 'Cukup Siap'
    WHEN v_score >= 60 THEN 'Perlu Pembinaan'
    ELSE 'Pembinaan Intensif'
  END;
  NEW.updated_at = now();

  IF NEW.coaching_recommendation IS NULL OR btrim(NEW.coaching_recommendation) = '' THEN
    NEW.coaching_recommendation = CASE NEW.category
      WHEN 'Sangat Siap' THEN 'Bisa membina Tahfizh/Tahsin Lanjutan dan dapat dipertimbangkan sebagai penguji.'
      WHEN 'Siap' THEN 'Bisa membina Tahfizh dan Tahsin Lanjutan.'
      WHEN 'Cukup Siap' THEN 'Cocok membina Tahsin Dasar/Iqro dengan pendampingan berkala.'
      WHEN 'Perlu Pembinaan' THEN 'Perlu mengikuti pembinaan sebelum diberi tugas sebagai penguji.'
      ELSE 'Difokuskan mengikuti pembinaan tahsin guru terlebih dahulu.'
    END;
  END IF;

  IF NEW.placement_recommendation IS NULL OR btrim(NEW.placement_recommendation) = '' THEN
    NEW.placement_recommendation = CASE NEW.category
      WHEN 'Sangat Siap' THEN 'Bisa membina Tahfizh/Tahsin Lanjutan dan dapat dipertimbangkan sebagai penguji.'
      WHEN 'Siap' THEN 'Bisa membina Tahfizh dan Tahsin Lanjutan.'
      WHEN 'Cukup Siap' THEN 'Cocok membina Tahsin Dasar/Iqro dengan pendampingan berkala.'
      WHEN 'Perlu Pembinaan' THEN 'Perlu mengikuti pembinaan sebelum diberi tugas sebagai penguji.'
      ELSE 'Difokuskan mengikuti pembinaan tahsin guru terlebih dahulu.'
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teacher_diagnostics_prepare ON public.teacher_diagnostics;
CREATE TRIGGER teacher_diagnostics_prepare
BEFORE INSERT OR UPDATE ON public.teacher_diagnostics
FOR EACH ROW
EXECUTE FUNCTION public.prepare_teacher_diagnostic();

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher profiles readable by owner or diagnostic admin" ON public.teacher_profiles;
CREATE POLICY "Teacher profiles readable by owner or diagnostic admin"
ON public.teacher_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_teacher_diagnostic_admin(auth.uid()));

DROP POLICY IF EXISTS "Teacher profiles insert by owner or diagnostic admin" ON public.teacher_profiles;
CREATE POLICY "Teacher profiles insert by owner or diagnostic admin"
ON public.teacher_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_teacher_diagnostic_admin(auth.uid()));

DROP POLICY IF EXISTS "Teacher profiles update by owner or diagnostic admin" ON public.teacher_profiles;
CREATE POLICY "Teacher profiles update by owner or diagnostic admin"
ON public.teacher_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_teacher_diagnostic_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_teacher_diagnostic_admin(auth.uid()));

DROP POLICY IF EXISTS "Teacher diagnostics readable by owner or diagnostic admin" ON public.teacher_diagnostics;
CREATE POLICY "Teacher diagnostics readable by owner or diagnostic admin"
ON public.teacher_diagnostics FOR SELECT TO authenticated
USING (
  public.is_teacher_diagnostic_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.teacher_profiles tp
    WHERE tp.id = teacher_diagnostics.teacher_profile_id
      AND tp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teacher diagnostics insert by diagnostic admin" ON public.teacher_diagnostics;
CREATE POLICY "Teacher diagnostics insert by diagnostic admin"
ON public.teacher_diagnostics FOR INSERT TO authenticated
WITH CHECK (public.is_teacher_diagnostic_admin(auth.uid()));

DROP POLICY IF EXISTS "Teacher diagnostics update by diagnostic admin" ON public.teacher_diagnostics;
CREATE POLICY "Teacher diagnostics update by diagnostic admin"
ON public.teacher_diagnostics FOR UPDATE TO authenticated
USING (public.is_teacher_diagnostic_admin(auth.uid()))
WITH CHECK (public.is_teacher_diagnostic_admin(auth.uid()));

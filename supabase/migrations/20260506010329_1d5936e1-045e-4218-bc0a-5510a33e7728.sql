
-- 1) teacher_students: relasi guru ↔ siswa
CREATE TABLE IF NOT EXISTS public.teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_students viewable by authenticated"
ON public.teacher_students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/guru insert teacher_students"
ON public.teacher_students FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'guru'));

CREATE POLICY "Admin/guru update teacher_students"
ON public.teacher_students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'guru'));

CREATE POLICY "Admin can delete teacher_students"
ON public.teacher_students FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON public.teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON public.teacher_students(student_id);

-- 2) teacher_classes: relasi guru ↔ kelas (kelas+rombel)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  kelas integer NOT NULL,
  rombel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, kelas, rombel)
);

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_classes viewable by authenticated"
ON public.teacher_classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/guru insert teacher_classes"
ON public.teacher_classes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'guru'));

CREATE POLICY "Admin/guru update teacher_classes"
ON public.teacher_classes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'guru'));

CREATE POLICY "Admin delete teacher_classes"
ON public.teacher_classes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON public.teacher_classes(teacher_id);

-- 3) monthly_targets: target halaman per bulan (efektif hari)
CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  program_type text NOT NULL,
  target_pages integer NOT NULL DEFAULT 15,
  effective_days integer NOT NULL DEFAULT 20,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, year, program_type)
);

ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_targets viewable by authenticated"
ON public.monthly_targets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage monthly_targets"
ON public.monthly_targets FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_monthly_targets_updated
BEFORE UPDATE ON public.monthly_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Backfill teacher_students dari monthly_reports lama
INSERT INTO public.teacher_students (teacher_id, student_id)
SELECT DISTINCT created_by, student_id
FROM public.monthly_reports
WHERE created_by IS NOT NULL AND student_id IS NOT NULL
ON CONFLICT (teacher_id, student_id) DO NOTHING;

-- 5) Backfill teacher_classes dari relasi di atas + tabel students
INSERT INTO public.teacher_classes (teacher_id, kelas, rombel)
SELECT DISTINCT mr.created_by, s.kelas, s.rombel
FROM public.monthly_reports mr
JOIN public.students s ON s.id = mr.student_id
WHERE mr.created_by IS NOT NULL
ON CONFLICT (teacher_id, kelas, rombel) DO NOTHING;

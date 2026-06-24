-- PART 01 - Struktur kolom, status, index, dan RLS policy teacher_students.
-- Jalankan part ini terlebih dahulu.

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE public.teacher_students
  DROP CONSTRAINT IF EXISTS teacher_students_status_check;

ALTER TABLE public.teacher_students
  ADD CONSTRAINT teacher_students_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'conflict', 'released'));

UPDATE public.teacher_students
SET status = 'approved',
    requested_at = COALESCE(requested_at, created_at, now()),
    requested_by = COALESCE(requested_by, teacher_id)
WHERE status IS NULL;

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY student_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.teacher_students
  WHERE status = 'approved'
)
UPDATE public.teacher_students ts
SET status = 'conflict',
    reviewed_at = now(),
    review_note = 'Ditandai konflik otomatis saat migrasi karena siswa sudah memiliki guru pembina lain.'
FROM ranked
WHERE ts.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_students_one_approved_student
  ON public.teacher_students (student_id)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_teacher_students_status
  ON public.teacher_students(status);

CREATE INDEX IF NOT EXISTS idx_teacher_students_student_status
  ON public.teacher_students(student_id, status);

DROP POLICY IF EXISTS "teacher_students viewable by authenticated" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin/guru insert teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin/guru update teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin can delete teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students select by authenticated" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students insert request or admin" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students admin update" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students admin delete" ON public.teacher_students;

CREATE POLICY "teacher_students select by authenticated"
ON public.teacher_students FOR SELECT TO authenticated
USING (true);

CREATE POLICY "teacher_students insert request or admin"
ON public.teacher_students FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'guru'::public.app_role)
    AND teacher_id = auth.uid()
    AND requested_by = auth.uid()
    AND status = 'pending'
  )
);

CREATE POLICY "teacher_students admin update"
ON public.teacher_students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "teacher_students admin delete"
ON public.teacher_students FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

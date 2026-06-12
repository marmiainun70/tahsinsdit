ALTER TABLE public.monthly_reports
  ADD COLUMN IF NOT EXISTS teacher_id uuid NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS teacher_name text NULL;

UPDATE public.monthly_reports AS mr
SET
  teacher_id = COALESCE(mr.teacher_id, mr.created_by),
  teacher_name = COALESCE(
    NULLIF(BTRIM(mr.teacher_name), ''),
    NULLIF(BTRIM(p.full_name), '')
  )
FROM public.profiles AS p
WHERE p.user_id = mr.created_by
  AND (
    mr.teacher_id IS NULL
    OR mr.teacher_name IS NULL
    OR BTRIM(mr.teacher_name) = ''
  );

UPDATE public.monthly_reports
SET teacher_id = created_by
WHERE teacher_id IS NULL
  AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_reports_period_teacher
  ON public.monthly_reports (year, month, teacher_id);

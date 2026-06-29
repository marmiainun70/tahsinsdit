ALTER TABLE public.monthly_reports
  ADD COLUMN IF NOT EXISTS student_name_snapshot text NULL,
  ADD COLUMN IF NOT EXISTS kelas_snapshot integer NULL,
  ADD COLUMN IF NOT EXISTS rombel_snapshot text NULL,
  ADD COLUMN IF NOT EXISTS level_snapshot text NULL,
  ADD COLUMN IF NOT EXISTS teacher_id_snapshot uuid NULL,
  ADD COLUMN IF NOT EXISTS teacher_name_snapshot text NULL;

UPDATE public.monthly_reports AS mr
SET
  student_name_snapshot = COALESCE(NULLIF(BTRIM(mr.student_name_snapshot), ''), s.nama),
  kelas_snapshot = COALESCE(mr.kelas_snapshot, s.kelas),
  rombel_snapshot = COALESCE(NULLIF(BTRIM(mr.rombel_snapshot), ''), s.rombel),
  level_snapshot = COALESCE(NULLIF(BTRIM(mr.level_snapshot), ''), s.level::text),
  teacher_id_snapshot = COALESCE(mr.teacher_id_snapshot, mr.teacher_id),
  teacher_name_snapshot = COALESCE(
    NULLIF(BTRIM(mr.teacher_name_snapshot), ''),
    NULLIF(BTRIM(mr.teacher_name), '')
  )
FROM public.students AS s
WHERE s.id = mr.student_id
  AND (
    mr.student_name_snapshot IS NULL
    OR BTRIM(mr.student_name_snapshot) = ''
    OR mr.kelas_snapshot IS NULL
    OR mr.rombel_snapshot IS NULL
    OR BTRIM(mr.rombel_snapshot) = ''
    OR mr.level_snapshot IS NULL
    OR BTRIM(mr.level_snapshot) = ''
    OR mr.teacher_id_snapshot IS NULL
    OR mr.teacher_name_snapshot IS NULL
    OR BTRIM(mr.teacher_name_snapshot) = ''
  );

CREATE INDEX IF NOT EXISTS idx_monthly_reports_period_class_snapshot
  ON public.monthly_reports (year, month, kelas_snapshot, rombel_snapshot);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_period_teacher_snapshot
  ON public.monthly_reports (year, month, teacher_id_snapshot);

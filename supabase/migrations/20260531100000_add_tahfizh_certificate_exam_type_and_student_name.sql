ALTER TYPE public.exam_schedule_type
ADD VALUE IF NOT EXISTS 'ujian_sertifikat_tahfizh';

ALTER TABLE public.exam_schedules
ADD COLUMN IF NOT EXISTS nama_siswa text NOT NULL DEFAULT '';

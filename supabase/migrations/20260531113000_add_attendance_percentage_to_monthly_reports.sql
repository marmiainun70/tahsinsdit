ALTER TABLE public.monthly_reports
ADD COLUMN IF NOT EXISTS attendance_percentage integer NOT NULL DEFAULT 0
CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100);


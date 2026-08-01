ALTER TABLE public.institution_settings
ADD COLUMN IF NOT EXISTS effective_days_per_month INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS effective_days_per_semester INTEGER DEFAULT 80;

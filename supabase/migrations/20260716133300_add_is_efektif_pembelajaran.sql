ALTER TABLE public.academic_calendar_days
ADD COLUMN is_efektif_pembelajaran BOOLEAN NOT NULL DEFAULT true;

-- Update existing data: if it's not efektif, it's not efektif pembelajaran either
UPDATE public.academic_calendar_days
SET is_efektif_pembelajaran = false
WHERE status != 'efektif';

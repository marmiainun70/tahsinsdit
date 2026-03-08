-- Tambah kolom perlu_perhatian dan catatan_perhatian ke tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS perlu_perhatian BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS catatan_perhatian TEXT DEFAULT '';

-- Fungsi trigger untuk otomatis update flag perlu_perhatian
-- Dipicu setiap kali ada INSERT atau UPDATE di tahsin_assessments
CREATE OR REPLACE FUNCTION public.check_tahsin_attention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_two RECORD;
  score_count INT := 0;
  below_threshold INT := 0;
BEGIN
  -- Ambil 2 penilaian terakhir untuk siswa ini
  SELECT COUNT(*) INTO score_count
  FROM (
    SELECT nilai_total
    FROM public.tahsin_assessments
    WHERE student_id = NEW.student_id
    ORDER BY tanggal DESC, created_at DESC
    LIMIT 2
  ) sub;

  SELECT COUNT(*) INTO below_threshold
  FROM (
    SELECT nilai_total
    FROM public.tahsin_assessments
    WHERE student_id = NEW.student_id
    ORDER BY tanggal DESC, created_at DESC
    LIMIT 2
  ) sub
  WHERE sub.nilai_total < 70;

  IF score_count >= 2 AND below_threshold = 2 THEN
    -- 2 penilaian berturut-turut di bawah 70 → set flag
    UPDATE public.students
    SET
      perlu_perhatian = true,
      catatan_perhatian = 'Nilai Tahsin di bawah 70 selama 2 penilaian berturut-turut (terakhir: ' || NEW.tanggal::text || ')'
    WHERE id = NEW.student_id;
  ELSE
    -- Reset flag jika kondisi tidak terpenuhi
    UPDATE public.students
    SET
      perlu_perhatian = false,
      catatan_perhatian = ''
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Pasang trigger ke tabel tahsin_assessments
DROP TRIGGER IF EXISTS trigger_check_tahsin_attention ON public.tahsin_assessments;
CREATE TRIGGER trigger_check_tahsin_attention
  AFTER INSERT OR UPDATE ON public.tahsin_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tahsin_attention();

-- Index untuk query cepat siswa yang perlu perhatian
CREATE INDEX IF NOT EXISTS idx_students_perlu_perhatian ON public.students(perlu_perhatian) WHERE perlu_perhatian = true;
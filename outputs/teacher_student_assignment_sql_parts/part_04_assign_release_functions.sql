-- PART 04 - Fungsi admin untuk menetapkan, memindahkan, dan melepas guru pembina.
-- Jalankan setelah part 03.

CREATE OR REPLACE FUNCTION public.assign_teacher_student(p_student_id uuid, p_teacher_id uuid)
RETURNS public.teacher_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.teacher_students;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menetapkan guru pembina';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_teacher_id
      AND role = 'guru'
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Guru tidak ditemukan atau belum disetujui';
  END IF;

  UPDATE public.teacher_students
  SET status = CASE WHEN status = 'approved' THEN 'released' ELSE 'conflict' END,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = 'Dipindahkan oleh admin.'
  WHERE student_id = p_student_id
    AND teacher_id <> p_teacher_id
    AND status IN ('approved', 'pending');

  INSERT INTO public.teacher_students (
    teacher_id,
    student_id,
    status,
    requested_by,
    requested_at,
    reviewed_at,
    reviewed_by,
    review_note
  )
  VALUES (
    p_teacher_id,
    p_student_id,
    'approved',
    auth.uid(),
    now(),
    now(),
    auth.uid(),
    'Ditetapkan admin.'
  )
  ON CONFLICT (teacher_id, student_id)
  DO UPDATE SET
    status = 'approved',
    requested_by = auth.uid(),
    requested_at = now(),
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    review_note = 'Ditetapkan admin.'
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_teacher_student(p_student_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melepas guru pembina';
  END IF;

  UPDATE public.teacher_students
  SET status = 'released',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = 'Dilepas oleh admin.'
  WHERE student_id = p_student_id
    AND status = 'approved';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

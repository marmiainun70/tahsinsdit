-- PART 02 - Fungsi request guru dan approve satu permintaan.
-- Jalankan setelah part 01.

CREATE OR REPLACE FUNCTION public.approve_teacher_student_request(p_request_id uuid)
RETURNS public.teacher_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.teacher_students;
  v_result public.teacher_students;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menyetujui permintaan murid binaan';
  END IF;

  SELECT *
  INTO v_request
  FROM public.teacher_students
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permintaan murid binaan tidak ditemukan';
  END IF;

  IF v_request.status = 'approved' THEN
    RETURN v_request;
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN v_request;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE student_id = v_request.student_id
      AND status = 'approved'
      AND id <> v_request.id
    FOR UPDATE
  ) THEN
    UPDATE public.teacher_students
    SET status = 'conflict',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        review_note = 'Konflik: siswa sudah memiliki guru pembina.'
    WHERE id = v_request.id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

  UPDATE public.teacher_students
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = NULL
  WHERE id = v_request.id
  RETURNING * INTO v_result;

  UPDATE public.teacher_students
  SET status = 'conflict',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = 'Konflik: siswa sudah disetujui untuk guru lain.'
  WHERE student_id = v_request.student_id
    AND status = 'pending'
    AND id <> v_request.id;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_teacher_student(p_student_id uuid)
RETURNS public.teacher_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.teacher_students;
BEGIN
  IF NOT public.has_role(auth.uid(), 'guru'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya guru yang dapat memilih murid binaan';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE student_id = p_student_id
      AND status = 'approved'
      AND teacher_id <> auth.uid()
  ) THEN
    RAISE EXCEPTION 'Siswa sudah memiliki guru pembina';
  END IF;

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
    auth.uid(),
    p_student_id,
    'pending',
    auth.uid(),
    now(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (teacher_id, student_id)
  DO UPDATE SET
    status = CASE
      WHEN public.teacher_students.status = 'approved' THEN public.teacher_students.status
      ELSE 'pending'
    END,
    requested_by = auth.uid(),
    requested_at = CASE
      WHEN public.teacher_students.status = 'approved' THEN public.teacher_students.requested_at
      ELSE now()
    END,
    reviewed_at = CASE
      WHEN public.teacher_students.status = 'approved' THEN public.teacher_students.reviewed_at
      ELSE NULL
    END,
    reviewed_by = CASE
      WHEN public.teacher_students.status = 'approved' THEN public.teacher_students.reviewed_by
      ELSE NULL
    END,
    review_note = CASE
      WHEN public.teacher_students.status = 'approved' THEN public.teacher_students.review_note
      ELSE NULL
    END
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

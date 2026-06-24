-- PART 03 - Fungsi tolak satu permintaan dan setujui semua pending.
-- Jalankan setelah part 02.

CREATE OR REPLACE FUNCTION public.reject_teacher_student_request(p_request_id uuid, p_note text DEFAULT NULL)
RETURNS public.teacher_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.teacher_students;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menolak permintaan murid binaan';
  END IF;

  UPDATE public.teacher_students
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = COALESCE(p_note, 'Ditolak admin.')
  WHERE id = p_request_id
    AND status = 'pending'
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permintaan pending tidak ditemukan';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_all_pending_teacher_student_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_result public.teacher_students;
  v_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menyetujui semua permintaan murid binaan';
  END IF;

  FOR v_request IN
    SELECT id
    FROM public.teacher_students
    WHERE status = 'pending'
    ORDER BY requested_at ASC, created_at ASC, id ASC
  LOOP
    v_result := public.approve_teacher_student_request(v_request.id);
    IF v_result.status = 'approved' THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

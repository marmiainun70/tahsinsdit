ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE public.teacher_students
  DROP CONSTRAINT IF EXISTS teacher_students_status_check;

ALTER TABLE public.teacher_students
  ADD CONSTRAINT teacher_students_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'conflict', 'released'));

UPDATE public.teacher_students
SET status = 'approved',
    requested_at = COALESCE(requested_at, created_at, now()),
    requested_by = COALESCE(requested_by, teacher_id)
WHERE status IS NULL;

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY student_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.teacher_students
  WHERE status = 'approved'
)
UPDATE public.teacher_students ts
SET status = 'conflict',
    reviewed_at = now(),
    review_note = 'Ditandai konflik otomatis saat migrasi karena siswa sudah memiliki guru pembina lain.'
FROM ranked
WHERE ts.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_students_one_approved_student
  ON public.teacher_students (student_id)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_teacher_students_status
  ON public.teacher_students(status);

CREATE INDEX IF NOT EXISTS idx_teacher_students_student_status
  ON public.teacher_students(student_id, status);

DROP POLICY IF EXISTS "teacher_students viewable by authenticated" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin/guru insert teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin/guru update teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "Admin can delete teacher_students" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students select by authenticated" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students insert request or admin" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students admin update" ON public.teacher_students;
DROP POLICY IF EXISTS "teacher_students admin delete" ON public.teacher_students;

CREATE POLICY "teacher_students select by authenticated"
ON public.teacher_students FOR SELECT TO authenticated
USING (true);

CREATE POLICY "teacher_students insert request or admin"
ON public.teacher_students FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'guru'::public.app_role)
    AND teacher_id = auth.uid()
    AND requested_by = auth.uid()
    AND status = 'pending'
  )
);

CREATE POLICY "teacher_students admin update"
ON public.teacher_students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "teacher_students admin delete"
ON public.teacher_students FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

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

CREATE OR REPLACE FUNCTION public.enforce_approved_teacher_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NOT public.has_role(auth.uid(), 'guru'::public.app_role) THEN
    RETURN NEW;
  END IF;

  v_student_id := NEW.student_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE teacher_id = auth.uid()
      AND student_id = v_student_id
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Guru hanya dapat mengelola murid binaan yang sudah disetujui admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_monthly_reports_teacher_student ON public.monthly_reports;
CREATE TRIGGER enforce_monthly_reports_teacher_student
BEFORE INSERT OR UPDATE ON public.monthly_reports
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approved_teacher_student();

DROP TRIGGER IF EXISTS enforce_attendance_teacher_student ON public.attendance;
CREATE TRIGGER enforce_attendance_teacher_student
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approved_teacher_student();

DROP TRIGGER IF EXISTS enforce_progress_entries_teacher_student ON public.progress_entries;
CREATE TRIGGER enforce_progress_entries_teacher_student
BEFORE INSERT OR UPDATE ON public.progress_entries
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approved_teacher_student();

DROP TRIGGER IF EXISTS enforce_exam_records_teacher_student ON public.exam_records;
CREATE TRIGGER enforce_exam_records_teacher_student
BEFORE INSERT OR UPDATE ON public.exam_records
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approved_teacher_student();

DROP TRIGGER IF EXISTS enforce_tahsin_assessments_teacher_student ON public.tahsin_assessments;
CREATE TRIGGER enforce_tahsin_assessments_teacher_student
BEFORE INSERT OR UPDATE ON public.tahsin_assessments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approved_teacher_student();

GRANT EXECUTE ON FUNCTION public.approve_teacher_student_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_teacher_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_teacher_student_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_all_pending_teacher_student_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_teacher_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_teacher_student(uuid) TO authenticated;

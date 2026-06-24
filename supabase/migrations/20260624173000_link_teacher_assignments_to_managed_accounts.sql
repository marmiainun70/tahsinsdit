CREATE OR REPLACE FUNCTION public.is_teacher_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND status = 'approved'
      AND COALESCE(NULLIF(BTRIM(role), ''), 'guru') NOT IN ('admin', 'parent')
  );
$$;

DROP POLICY IF EXISTS "teacher_students insert request or admin" ON public.teacher_students;

CREATE POLICY "teacher_students insert request or admin"
ON public.teacher_students FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.is_teacher_account(auth.uid())
    AND teacher_id = auth.uid()
    AND requested_by = auth.uid()
    AND status = 'pending'
  )
);

CREATE OR REPLACE FUNCTION public.request_teacher_student(p_student_id uuid)
RETURNS public.teacher_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.teacher_students;
BEGIN
  IF NOT public.is_teacher_account(auth.uid()) THEN
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

  IF NOT public.is_teacher_account(p_teacher_id) THEN
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

  IF NOT public.is_teacher_account(auth.uid()) THEN
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

CREATE OR REPLACE FUNCTION public.list_active_teacher_accounts()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  role text,
  status text,
  username text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melihat daftar guru';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    NULLIF(BTRIM(p.full_name), ''),
    p.role,
    p.status,
    NULLIF(BTRIM(p.username), ''),
    u.email::text
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.status = 'approved'
    AND COALESCE(NULLIF(BTRIM(p.role), ''), 'guru') NOT IN ('admin', 'parent')
  ORDER BY COALESCE(NULLIF(BTRIM(p.full_name), ''), u.email, p.username, p.user_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_teacher_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_teacher_accounts() TO authenticated;

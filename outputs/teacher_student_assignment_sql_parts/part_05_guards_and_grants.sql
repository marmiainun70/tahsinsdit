-- PART 05 - Guard database untuk laporan/absensi dan grant RPC.
-- Jalankan terakhir.

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

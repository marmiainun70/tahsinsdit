
-- 1. View: enforce security_invoker
ALTER VIEW public.vw_peserta_asesmen_detail SET (security_invoker = on);

-- 2. Set search_path on functions currently missing it
ALTER FUNCTION public.touch_spreadsheet_layout_settings_updated_at() SET search_path = public;
ALTER FUNCTION public.set_teacher_profile_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_session_status_change() SET search_path = public;
ALTER FUNCTION public.prepare_teacher_diagnostic() SET search_path = public;
ALTER FUNCTION public.generate_random_soal_for_paket(uuid, character varying, character varying, character varying, integer) SET search_path = public;

-- 3. Revoke EXECUTE from PUBLIC/anon on all SECURITY DEFINER functions in public schema
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- Re-grant only to authenticated for RPCs called from client
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_diagnostic_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_teacher_student_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_teacher_student_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_all_pending_teacher_student_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_teacher_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_teacher_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_teacher_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_teacher_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_academic_year_transition(uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_mapping_suggestion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transition_preview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transition_history(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) TO authenticated;

-- 4. STUDENTS: remove anon read + tighten writes to admin
DROP POLICY IF EXISTS "Public can search students for registration" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;

CREATE POLICY "Admin can insert students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin can update students" ON public.students
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin can delete students" ON public.students
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Registration lookup: security definer RPC exposing minimal fields
CREATE OR REPLACE FUNCTION public.list_students_for_registration()
RETURNS TABLE(id uuid, nama text, kelas integer, rombel text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.nama, s.kelas, s.rombel
  FROM public.students s
  WHERE s.status_siswa = 'aktif'
  ORDER BY s.nama
$$;
GRANT EXECUTE ON FUNCTION public.list_students_for_registration() TO anon, authenticated;

-- 5. PROFILES: restrict SELECT to owner + admin
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. PARENTS: guru can only see parents of their assigned students
DROP POLICY IF EXISTS "Admins and guru can view all parents" ON public.parents;
CREATE POLICY "Admin can view all parents" ON public.parents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Guru can view parents of assigned students" ON public.parents
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'guru'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.teacher_students ts
      WHERE ts.teacher_id = auth.uid()
        AND ts.student_id = parents.student_id
        AND ts.status = 'approved'
    )
  );

-- 7. Storage bucket 'institution': restrict listing to authenticated
DROP POLICY IF EXISTS "Institution assets public read" ON storage.objects;
CREATE POLICY "Institution assets authenticated list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'institution');

-- 8. Tighten broad-true write policies on operational tables to admin
-- academic_years
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.academic_years;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.academic_years;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.academic_years;
CREATE POLICY "Admin can insert academic_years" ON public.academic_years FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can update academic_years" ON public.academic_years FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can delete academic_years" ON public.academic_years FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- academic_calendar_days
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.academic_calendar_days;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.academic_calendar_days;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.academic_calendar_days;
CREATE POLICY "Admin can insert calendar_days" ON public.academic_calendar_days FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can update calendar_days" ON public.academic_calendar_days FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can delete calendar_days" ON public.academic_calendar_days FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- academic_calendar_settings
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.academic_calendar_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.academic_calendar_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.academic_calendar_settings;
CREATE POLICY "Admin can insert calendar_settings" ON public.academic_calendar_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can update calendar_settings" ON public.academic_calendar_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can delete calendar_settings" ON public.academic_calendar_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- academic_calendar_sync_history
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.academic_calendar_sync_history;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.academic_calendar_sync_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.academic_calendar_sync_history;
CREATE POLICY "Admin can insert calendar_sync" ON public.academic_calendar_sync_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can update calendar_sync" ON public.academic_calendar_sync_history FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin can delete calendar_sync" ON public.academic_calendar_sync_history FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- activity_logs: writes only for admin/guru
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can delete activity logs" ON public.activity_logs;
CREATE POLICY "Admin or guru can insert activity_logs" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'guru'::public.app_role));
CREATE POLICY "Admin can delete activity_logs" ON public.activity_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

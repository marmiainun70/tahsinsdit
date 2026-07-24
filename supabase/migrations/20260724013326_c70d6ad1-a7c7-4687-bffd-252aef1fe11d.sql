
-- =========================================================
-- Helper functions for relationship-based access
-- =========================================================
CREATE OR REPLACE FUNCTION public.can_access_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.teacher_students ts
      WHERE ts.student_id = _student_id
        AND ts.teacher_id = auth.uid()
        AND ts.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.teacher_classes tc
      JOIN public.students s ON s.kelas = tc.kelas AND s.rombel = tc.rombel
      WHERE tc.teacher_id = auth.uid() AND s.id = _student_id
    )
    OR EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.student_id = _student_id AND p.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.teacher_students ts
      WHERE ts.student_id = _student_id
        AND ts.teacher_id = auth.uid()
        AND ts.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.teacher_classes tc
      JOIN public.students s ON s.kelas = tc.kelas AND s.rombel = tc.rombel
      WHERE tc.teacher_id = auth.uid() AND s.id = _student_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_student(uuid) TO authenticated;

-- =========================================================
-- students SELECT
-- =========================================================
DROP POLICY IF EXISTS "Students viewable by authenticated users" ON public.students;
CREATE POLICY "Students viewable by related users"
ON public.students FOR SELECT TO authenticated
USING (public.can_access_student(id));

-- =========================================================
-- activity_logs SELECT
-- =========================================================
DROP POLICY IF EXISTS "Activity logs viewable by authenticated users" ON public.activity_logs;
CREATE POLICY "Activity logs viewable by related users"
ON public.activity_logs FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

-- =========================================================
-- attendance SELECT
-- =========================================================
DROP POLICY IF EXISTS "Attendance viewable by authenticated" ON public.attendance;
CREATE POLICY "Attendance viewable by related users"
ON public.attendance FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

-- =========================================================
-- attendance_period_settings SELECT
-- =========================================================
DROP POLICY IF EXISTS "Attendance period settings readable by authenticated" ON public.attendance_period_settings;
CREATE POLICY "Attendance period settings readable by staff"
ON public.attendance_period_settings FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_teacher_account(auth.uid())
);

-- =========================================================
-- config_audit_log — admin only
-- =========================================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.config_audit_log;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.config_audit_log;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.config_audit_log;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.config_audit_log;

CREATE POLICY "Admin can read config audit log"
ON public.config_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can insert config audit log"
ON public.config_audit_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can update config audit log"
ON public.config_audit_log FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can delete config audit log"
ON public.config_audit_log FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- evaluasi_* tables — admin/koordinator/guru diagnostik only
-- =========================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'evaluasi_makharij','evaluasi_sambung_ayat','evaluasi_tajwid','evaluasi_waqaf',
      'evaluasi_kelancaran','evaluasi_kesalahan_bacaan','evaluasi_awal_semester',
      'evaluasi_profil_awal','evaluasi_tahfizh','evaluasi_rekomendasi',
      'evaluasi_lahn','evaluasi_waqaf_ibtida'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated all %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Manage %s" ON public.%I',
      CASE t
        WHEN 'evaluasi_lahn' THEN 'lahn'
        WHEN 'evaluasi_sambung_ayat' THEN 'sambung ayat'
        WHEN 'evaluasi_waqaf_ibtida' THEN 'waqaf ibtida'
        ELSE t
      END, t);
    EXECUTE format(
      'CREATE POLICY "Diagnostic staff manage %I" ON public.%I FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid())) WITH CHECK (public.is_teacher_diagnostic_admin(auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

-- =========================================================
-- exam_participants
-- =========================================================
DROP POLICY IF EXISTS "Exam participants viewable by authenticated users" ON public.exam_participants;
DROP POLICY IF EXISTS "Authenticated users can insert exam participants" ON public.exam_participants;
DROP POLICY IF EXISTS "Authenticated users can delete exam participants" ON public.exam_participants;

CREATE POLICY "Exam participants viewable by related"
ON public.exam_participants FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

CREATE POLICY "Staff can insert exam participants"
ON public.exam_participants FOR INSERT TO authenticated
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can delete exam participants"
ON public.exam_participants FOR DELETE TO authenticated
USING (public.can_manage_student(student_id));

-- =========================================================
-- exam_records
-- =========================================================
DROP POLICY IF EXISTS "Exams viewable by authenticated users" ON public.exam_records;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON public.exam_records;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON public.exam_records;
DROP POLICY IF EXISTS "Authenticated users can delete exams" ON public.exam_records;

CREATE POLICY "Exam records viewable by related"
ON public.exam_records FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

CREATE POLICY "Staff can insert exam records"
ON public.exam_records FOR INSERT TO authenticated
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can update exam records"
ON public.exam_records FOR UPDATE TO authenticated
USING (public.can_manage_student(student_id))
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can delete exam records"
ON public.exam_records FOR DELETE TO authenticated
USING (public.can_manage_student(student_id));

-- =========================================================
-- exam_schedules
-- =========================================================
DROP POLICY IF EXISTS "Exam schedules viewable by authenticated users" ON public.exam_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert exam schedules" ON public.exam_schedules;
DROP POLICY IF EXISTS "Authenticated users can update exam schedules" ON public.exam_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete exam schedules" ON public.exam_schedules;

CREATE POLICY "Exam schedules viewable by staff"
ON public.exam_schedules FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_teacher_account(auth.uid())
);

CREATE POLICY "Admin can insert exam schedules"
ON public.exam_schedules FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can update exam schedules"
ON public.exam_schedules FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can delete exam schedules"
ON public.exam_schedules FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- monitoring_settings & riwayat_kinerja_guru — use has_role
-- =========================================================
DROP POLICY IF EXISTS "Admin dapat melihat monitoring settings" ON public.monitoring_settings;
DROP POLICY IF EXISTS "Admin dapat mengubah monitoring settings" ON public.monitoring_settings;

CREATE POLICY "Admin can view monitoring settings"
ON public.monitoring_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can manage monitoring settings"
ON public.monitoring_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin dapat melihat riwayat kinerja guru" ON public.riwayat_kinerja_guru;
DROP POLICY IF EXISTS "Admin dapat mengubah riwayat kinerja guru" ON public.riwayat_kinerja_guru;

CREATE POLICY "Admin can view riwayat kinerja guru"
ON public.riwayat_kinerja_guru FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can manage riwayat kinerja guru"
ON public.riwayat_kinerja_guru FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- monthly_reports SELECT
-- =========================================================
DROP POLICY IF EXISTS "Monthly reports viewable by authenticated" ON public.monthly_reports;
CREATE POLICY "Monthly reports viewable by related"
ON public.monthly_reports FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

-- =========================================================
-- profiles — self-role/status lock + teacher profile scoping
-- =========================================================
DROP TRIGGER IF EXISTS prevent_self_status_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_self_status_role_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_status_role_change();

DROP POLICY IF EXISTS "Allow authenticated to read teacher profiles" ON public.profiles;
CREATE POLICY "Related users can read teacher profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  COALESCE(NULLIF(BTRIM(role), ''), '') IN ('guru','koordinator','coordinator','admin')
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_teacher_account(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.parents pa
      JOIN public.teacher_students ts ON ts.student_id = pa.student_id AND ts.status = 'approved'
      WHERE pa.user_id = auth.uid() AND ts.teacher_id = profiles.user_id
    )
  )
);

-- =========================================================
-- progress_entries
-- =========================================================
DROP POLICY IF EXISTS "Progress viewable by authenticated users" ON public.progress_entries;
DROP POLICY IF EXISTS "Authenticated users can insert progress" ON public.progress_entries;
DROP POLICY IF EXISTS "Authenticated users can update progress" ON public.progress_entries;
DROP POLICY IF EXISTS "Authenticated users can delete progress" ON public.progress_entries;

CREATE POLICY "Progress viewable by related"
ON public.progress_entries FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

CREATE POLICY "Staff can insert progress"
ON public.progress_entries FOR INSERT TO authenticated
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can update progress"
ON public.progress_entries FOR UPDATE TO authenticated
USING (public.can_manage_student(student_id))
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can delete progress"
ON public.progress_entries FOR DELETE TO authenticated
USING (public.can_manage_student(student_id));

-- =========================================================
-- tahsin_assessments
-- =========================================================
DROP POLICY IF EXISTS "Tahsin assessments viewable by authenticated users" ON public.tahsin_assessments;
DROP POLICY IF EXISTS "Authenticated users can insert tahsin assessments" ON public.tahsin_assessments;
DROP POLICY IF EXISTS "Authenticated users can update tahsin assessments" ON public.tahsin_assessments;
DROP POLICY IF EXISTS "Authenticated users can delete tahsin assessments" ON public.tahsin_assessments;

CREATE POLICY "Tahsin assessments viewable by related"
ON public.tahsin_assessments FOR SELECT TO authenticated
USING (public.can_access_student(student_id));

CREATE POLICY "Staff can insert tahsin assessments"
ON public.tahsin_assessments FOR INSERT TO authenticated
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can update tahsin assessments"
ON public.tahsin_assessments FOR UPDATE TO authenticated
USING (public.can_manage_student(student_id))
WITH CHECK (public.can_manage_student(student_id));

CREATE POLICY "Staff can delete tahsin assessments"
ON public.tahsin_assessments FOR DELETE TO authenticated
USING (public.can_manage_student(student_id));

-- =========================================================
-- teacher_students SELECT
-- =========================================================
DROP POLICY IF EXISTS "teacher_students select by authenticated" ON public.teacher_students;
CREATE POLICY "teacher_students viewable by related"
ON public.teacher_students FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parents p
    WHERE p.student_id = teacher_students.student_id AND p.user_id = auth.uid()
  )
);

-- =========================================================
-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.check_tahsin_attention() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_approved_teacher_student() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_student_identity_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_session_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_attention_flag() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_exam_record() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_monthly_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_status_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_approved_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- =========================================================
-- storage.objects — remove broad listing on public bucket
-- =========================================================
DROP POLICY IF EXISTS "Institution assets authenticated list" ON storage.objects;
-- Public downloads via direct object URL still work; listing/enumeration is disabled.


CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type text, _title text, _body text,
  _link text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_allowed boolean := true; v_pref record;
BEGIN
  SELECT * INTO v_pref FROM notification_preferences WHERE user_id = _user_id;
  IF FOUND THEN
    v_allowed := CASE _type
      WHEN 'monthly_report' THEN v_pref.monthly_report
      WHEN 'exam_result' THEN v_pref.exam_result
      WHEN 'exam_reminder' THEN v_pref.exam_reminder
      WHEN 'attention_alert' THEN v_pref.attention_alert
      WHEN 'announcement' THEN v_pref.announcement
      ELSE true END;
  END IF;
  IF v_allowed THEN
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (_user_id, _type, _title, _body, _link, _metadata);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_on_monthly_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_parent record;
BEGIN
  SELECT nama INTO v_name FROM students WHERE id = NEW.student_id;
  FOR v_parent IN SELECT user_id FROM parents WHERE student_id = NEW.student_id LOOP
    PERFORM create_notification(v_parent.user_id,'monthly_report','Laporan Bulanan Baru',
      COALESCE(v_name,'Siswa')||' — Laporan '||NEW.month||'/'||NEW.year||' tersedia.',
      '/student/'||NEW.student_id, jsonb_build_object('student_id',NEW.student_id,'report_id',NEW.id));
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_monthly_report ON public.monthly_reports;
CREATE TRIGGER trg_notify_monthly_report AFTER INSERT ON public.monthly_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_on_monthly_report();

CREATE OR REPLACE FUNCTION public.notify_on_exam_record()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_parent record;
BEGIN
  SELECT nama INTO v_name FROM students WHERE id = NEW.student_id;
  FOR v_parent IN SELECT user_id FROM parents WHERE student_id = NEW.student_id LOOP
    PERFORM create_notification(v_parent.user_id,'exam_result','Hasil Ujian Tersedia',
      COALESCE(v_name,'Siswa')||' — '||NEW.level_diuji||': '||NEW.hasil,
      '/student/'||NEW.student_id, jsonb_build_object('student_id',NEW.student_id,'exam_id',NEW.id,'hasil',NEW.hasil));
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_exam_record ON public.exam_records;
CREATE TRIGGER trg_notify_exam_record AFTER INSERT ON public.exam_records
FOR EACH ROW EXECUTE FUNCTION public.notify_on_exam_record();

CREATE OR REPLACE FUNCTION public.notify_on_attention_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_teacher record;
BEGIN
  IF NEW.perlu_perhatian = true AND (OLD.perlu_perhatian IS DISTINCT FROM NEW.perlu_perhatian) THEN
    FOR v_teacher IN SELECT DISTINCT teacher_id AS user_id FROM teacher_classes
      WHERE kelas = NEW.kelas AND rombel = NEW.rombel LOOP
      PERFORM create_notification(v_teacher.user_id,'attention_alert','Peringatan: Perlu Perhatian',
        NEW.nama||' membutuhkan perhatian khusus.','/student/'||NEW.id,
        jsonb_build_object('student_id',NEW.id));
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_attention ON public.students;
CREATE TRIGGER trg_notify_attention AFTER UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.notify_on_attention_flag();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

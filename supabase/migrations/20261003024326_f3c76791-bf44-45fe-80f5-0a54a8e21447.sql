CREATE OR REPLACE FUNCTION public.enforce_monthly_report_teacher_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_name text;
BEGIN
  IF NEW.teacher_id IS NOT NULL THEN
    SELECT NULLIF(btrim(full_name),'') INTO v_name FROM public.profiles WHERE user_id = NEW.teacher_id;
    IF v_name IS NOT NULL THEN
      NEW.teacher_name := v_name;
      NEW.teacher_name_snapshot := v_name;
      NEW.teacher_id_snapshot := NEW.teacher_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_monthly_report_teacher_name() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_monthly_report_teacher_name ON public.monthly_reports;
CREATE TRIGGER trg_monthly_report_teacher_name BEFORE INSERT OR UPDATE ON public.monthly_reports
FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_report_teacher_name();
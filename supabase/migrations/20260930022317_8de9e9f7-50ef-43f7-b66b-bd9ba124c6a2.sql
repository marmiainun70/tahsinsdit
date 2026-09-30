CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_att_year int; v_att_month int; v_att_pct int := 0;
  v_rep_year int; v_rep_month int; v_rep_pct int := 0;
BEGIN
  SELECT year, month INTO v_att_year, v_att_month FROM attendance ORDER BY year DESC, month DESC LIMIT 1;
  IF v_att_year IS NOT NULL THEN
    SELECT COALESCE(ROUND(100.0 * SUM(present) / NULLIF(SUM(present+sick+permission+absent),0)),0)
      INTO v_att_pct FROM attendance WHERE year=v_att_year AND month=v_att_month;
  END IF;
  SELECT year, month INTO v_rep_year, v_rep_month FROM monthly_reports ORDER BY year DESC, month DESC LIMIT 1;
  IF v_rep_year IS NOT NULL THEN
    SELECT COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE achievement_status='achieved') / NULLIF(COUNT(*),0)),0)
      INTO v_rep_pct FROM monthly_reports WHERE year=v_rep_year AND month=v_rep_month;
  END IF;
  RETURN jsonb_build_object(
    'siswa_aktif', (SELECT COUNT(*) FROM students WHERE status_siswa='aktif'),
    'guru', (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN profiles p ON p.user_id=ur.user_id WHERE ur.role='guru' AND p.status='approved'),
    'rombel', (SELECT COUNT(*) FROM (SELECT DISTINCT kelas, rombel FROM students WHERE status_siswa='aktif') t),
    'kehadiran', v_att_pct, 'kehadiran_bulan', v_att_month, 'kehadiran_tahun', v_att_year,
    'progres', v_rep_pct, 'progres_bulan', v_rep_month, 'progres_tahun', v_rep_year,
    'catatan_aktivitas', (SELECT COUNT(*) FROM progress_entries) + (SELECT COUNT(*) FROM activity_logs),
    'laporan', (SELECT COUNT(*) FROM monthly_reports)
  );
END $$;
REVOKE ALL ON FUNCTION public.get_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated;
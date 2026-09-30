DROP POLICY IF EXISTS "Admin upload institution assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin update institution assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete institution assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin read institution assets" ON storage.objects;
CREATE POLICY "Admin upload institution assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='institution' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kepala_sekolah')));
CREATE POLICY "Admin update institution assets" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='institution' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kepala_sekolah')));
CREATE POLICY "Admin delete institution assets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='institution' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kepala_sekolah')));
CREATE POLICY "Admin read institution assets" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='institution' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kepala_sekolah')));

CREATE OR REPLACE FUNCTION public.get_landing_stats()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    'guru', (SELECT COUNT(*) FROM profiles p WHERE p.status='approved'
             AND lower(trim(coalesce(p.role,''))) NOT IN ('','admin','kepala_sekolah','parent')),
    'rombel', (SELECT COUNT(*) FROM (SELECT DISTINCT kelas, rombel FROM students WHERE status_siswa='aktif') t),
    'kehadiran', v_att_pct, 'kehadiran_bulan', v_att_month, 'kehadiran_tahun', v_att_year,
    'progres', v_rep_pct, 'progres_bulan', v_rep_month, 'progres_tahun', v_rep_year,
    'catatan_aktivitas', (SELECT COUNT(*) FROM progress_entries) + (SELECT COUNT(*) FROM activity_logs),
    'laporan', (SELECT COUNT(*) FROM monthly_reports)
  );
END $function$;
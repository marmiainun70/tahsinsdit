-- 1. Update the status change trigger to run as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.peserta_asesmen 
        SET status = 'Sedang Mengerjakan', waktu_mulai = NEW.started_at
        WHERE id = NEW.peserta_asesmen_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Selesai' AND OLD.status != 'Selesai' THEN
        UPDATE public.peserta_asesmen 
        SET status = 'Selesai', waktu_selesai = NEW.finished_at, nilai_akhir = NEW.nilai
        WHERE id = NEW.peserta_asesmen_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Admin and Coordinator full access to paket_asesmen" ON public.paket_asesmen;
DROP POLICY IF EXISTS "Admin and Coordinator full access to paket_asesmen_soal" ON public.paket_asesmen_soal;
DROP POLICY IF EXISTS "Admin and Coordinator full access to peserta_asesmen" ON public.peserta_asesmen;
DROP POLICY IF EXISTS "Admin and Coordinator full access to asesmen_session" ON public.asesmen_session;
DROP POLICY IF EXISTS "Admin and Coordinator full access to asesmen_jawaban" ON public.asesmen_jawaban;

-- 3. Create case-insensitive, unified RLS policies using public.is_teacher_diagnostic_admin
CREATE POLICY "Admin and Coordinator full access to paket_asesmen" ON public.paket_asesmen
    FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid()));

CREATE POLICY "Admin and Coordinator full access to paket_asesmen_soal" ON public.paket_asesmen_soal
    FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid()));

CREATE POLICY "Admin and Coordinator full access to peserta_asesmen" ON public.peserta_asesmen
    FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid()));

CREATE POLICY "Admin and Coordinator full access to asesmen_session" ON public.asesmen_session
    FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid()));

CREATE POLICY "Admin and Coordinator full access to asesmen_jawaban" ON public.asesmen_jawaban
    FOR ALL TO authenticated USING (public.is_teacher_diagnostic_admin(auth.uid()));

-- 4. Retroactively sync and fix participants who completed their exams today since 10:00 AM local time
UPDATE public.peserta_asesmen pa
SET status = s.status,
    waktu_mulai = s.started_at,
    waktu_selesai = s.finished_at,
    nilai_akhir = s.nilai
FROM public.asesmen_session s
WHERE pa.id = s.peserta_asesmen_id
  AND s.status = 'Selesai'
  AND pa.status != 'Selesai';

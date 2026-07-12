-- 1. Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Guru can view assigned paket_asesmen" ON public.paket_asesmen;
DROP POLICY IF EXISTS "Guru can view assigned paket_asesmen_soal" ON public.paket_asesmen_soal;
DROP POLICY IF EXISTS "Guru can view assigned bank_soal" ON public.bank_soal;

-- 2. Create policy for public.paket_asesmen
-- Allows teachers (guru) to read packages assigned to them via peserta_asesmen
CREATE POLICY "Guru can view assigned paket_asesmen" ON public.paket_asesmen
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.peserta_asesmen pa
            JOIN public.teacher_profiles tp ON pa.guru_id = tp.id
            WHERE pa.paket_id = public.paket_asesmen.id
            AND tp.user_id = auth.uid()
        )
    );

-- 3. Create policy for public.paket_asesmen_soal
-- Allows teachers (guru) to read the question links of packages assigned to them
CREATE POLICY "Guru can view assigned paket_asesmen_soal" ON public.paket_asesmen_soal
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.peserta_asesmen pa
            JOIN public.teacher_profiles tp ON pa.guru_id = tp.id
            WHERE pa.paket_id = public.paket_asesmen_soal.paket_id
            AND tp.user_id = auth.uid()
        )
    );

-- 4. Create policy for public.bank_soal
-- Allows teachers (guru) to read the question details (soal, opsi) of packages assigned to them
CREATE POLICY "Guru can view assigned bank_soal" ON public.bank_soal
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.paket_asesmen_soal pas
            JOIN public.peserta_asesmen pa ON pas.paket_id = pa.paket_id
            JOIN public.teacher_profiles tp ON pa.guru_id = tp.id
            WHERE pas.soal_id = public.bank_soal.id
            AND tp.user_id = auth.uid()
        )
    );

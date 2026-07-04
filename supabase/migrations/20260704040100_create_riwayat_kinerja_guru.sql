CREATE TABLE public.riwayat_kinerja_guru (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guru_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sesi TEXT NOT NULL,
    bulan TEXT NOT NULL, -- Format 'YYYY-MM'
    ibp_raw NUMERIC NOT NULL,
    ibp_status TEXT NOT NULL,
    ipp_score NUMERIC NOT NULL,
    ipp_status TEXT NOT NULL,
    sep_status TEXT NOT NULL,
    active_students INTEGER NOT NULL DEFAULT 0,
    versi_formula TEXT NOT NULL DEFAULT '1.0',
    dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(guru_id, sesi, bulan)
);

ALTER TABLE public.riwayat_kinerja_guru ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin dapat melihat riwayat kinerja guru"
    ON public.riwayat_kinerja_guru FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin dapat mengubah riwayat kinerja guru"
    ON public.riwayat_kinerja_guru FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

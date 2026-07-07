-- Buat tabel peserta_asesmen
CREATE TABLE public.peserta_asesmen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paket_id UUID NOT NULL REFERENCES public.paket_asesmen(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Mulai', -- 'Belum Mulai', 'Sedang Mengerjakan', 'Selesai'
    waktu_mulai TIMESTAMP WITH TIME ZONE,
    waktu_selesai TIMESTAMP WITH TIME ZONE,
    nilai_akhir NUMERIC(5,2),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(paket_id, guru_id)
);

-- Atur Row Level Security (RLS)
ALTER TABLE public.peserta_asesmen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Coordinator full access to peserta_asesmen" ON public.peserta_asesmen
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

-- Policy untuk guru melihat data mereka sendiri (opsional untuk fitur CBT kedepannya)
CREATE POLICY "Guru can view their own asesmen" ON public.peserta_asesmen
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teacher_profiles
            WHERE teacher_profiles.id = peserta_asesmen.guru_id
            AND teacher_profiles.user_id = auth.uid()
        )
    );

-- Trigger updated_at
CREATE TRIGGER trigger_update_peserta_asesmen_updated_at
BEFORE UPDATE ON public.peserta_asesmen
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- View untuk memudahkan join antara peserta_asesmen dan teacher_profiles
CREATE OR REPLACE VIEW public.vw_peserta_asesmen_detail AS
SELECT 
    pa.id,
    pa.paket_id,
    pa.guru_id,
    tp.full_name as nama_guru,
    pa.status,
    pa.waktu_mulai,
    pa.waktu_selesai,
    pa.nilai_akhir,
    pa.catatan,
    pa.created_at
FROM 
    public.peserta_asesmen pa
JOIN 
    public.teacher_profiles tp ON pa.guru_id = tp.id;

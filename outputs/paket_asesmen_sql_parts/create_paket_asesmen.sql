-- Buat tabel paket_asesmen
CREATE TABLE public.paket_asesmen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_paket VARCHAR(255) NOT NULL,
    kode_paket VARCHAR(100) NOT NULL UNIQUE,
    jenis_asesmen VARCHAR(100) NOT NULL,
    periode VARCHAR(100) NOT NULL,
    tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    durasi_menit INTEGER NOT NULL DEFAULT 60,
    nilai_minimum INTEGER NOT NULL DEFAULT 70,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    jumlah_soal INTEGER NOT NULL DEFAULT 10,
    acak_soal BOOLEAN DEFAULT false,
    acak_opsi BOOLEAN DEFAULT false,
    kategori_kompetensi TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Atur Row Level Security (RLS)
ALTER TABLE public.paket_asesmen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Coordinator full access to paket_asesmen" ON public.paket_asesmen
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

-- Trigger updated_at
CREATE TRIGGER trigger_update_paket_asesmen_updated_at
BEFORE UPDATE ON public.paket_asesmen
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Buat tabel relasi paket_asesmen_soal
CREATE TABLE public.paket_asesmen_soal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paket_id UUID NOT NULL REFERENCES public.paket_asesmen(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES public.bank_soal(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(paket_id, soal_id)
);

ALTER TABLE public.paket_asesmen_soal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Coordinator full access to paket_asesmen_soal" ON public.paket_asesmen_soal
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

-- Fungsi untuk generate soal otomatis (RPC)
CREATE OR REPLACE FUNCTION public.generate_random_soal_for_paket(
    p_paket_id UUID,
    p_kategori VARCHAR,
    p_sub_aspek VARCHAR,
    p_tingkat_kesulitan VARCHAR,
    p_jumlah_soal INTEGER
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    WITH selected_soal AS (
        SELECT id
        FROM public.bank_soal
        WHERE aktif = true
          AND (p_kategori IS NULL OR p_kategori = '' OR kategori = p_kategori)
          AND (p_sub_aspek IS NULL OR p_sub_aspek = '' OR sub_aspek = p_sub_aspek)
          AND (p_tingkat_kesulitan IS NULL OR p_tingkat_kesulitan = '' OR tingkat_kesulitan = p_tingkat_kesulitan)
          AND id NOT IN (SELECT soal_id FROM public.paket_asesmen_soal WHERE paket_id = p_paket_id)
        ORDER BY random()
        LIMIT p_jumlah_soal
    )
    INSERT INTO public.paket_asesmen_soal (paket_id, soal_id)
    SELECT p_paket_id, id FROM selected_soal;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

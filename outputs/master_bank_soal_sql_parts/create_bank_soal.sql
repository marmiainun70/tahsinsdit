-- Buat tabel bank_soal
CREATE TABLE public.bank_soal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kategori VARCHAR(100) NOT NULL, -- e.g., 'Tahsin', 'Tahfizh'
    sub_aspek VARCHAR(100) NOT NULL, -- e.g., 'Makhraj', 'Sifat', 'Tajwid'
    tipe_soal VARCHAR(50) NOT NULL, -- e.g., 'Pilihan Ganda', 'Essay'
    level_kognitif VARCHAR(50) NOT NULL, -- e.g., 'C1', 'C2', 'C3'
    tingkat_kesulitan VARCHAR(50) NOT NULL, -- e.g., 'Mudah', 'Sedang', 'Sulit'
    indikator_kompetensi TEXT NOT NULL,
    soal TEXT NOT NULL,
    opsi_a TEXT,
    opsi_b TEXT,
    opsi_c TEXT,
    opsi_d TEXT,
    jawaban_benar VARCHAR(255) NOT NULL,
    pembahasan TEXT,
    bobot INTEGER DEFAULT 1 NOT NULL,
    aktif BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Atur Row Level Security (RLS)
ALTER TABLE public.bank_soal ENABLE ROW LEVEL SECURITY;

-- Policy untuk Admin dan Koordinator agar bisa membaca dan menulis
CREATE POLICY "Admin and Coordinator full access to bank_soal" ON public.bank_soal
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

-- Trigger untuk update `updated_at` otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_soal_updated_at
BEFORE UPDATE ON public.bank_soal
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

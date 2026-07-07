-- Buat tabel asesmen_session
CREATE TABLE public.asesmen_session (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    peserta_asesmen_id UUID NOT NULL UNIQUE REFERENCES public.peserta_asesmen(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    remaining_time INTEGER, -- sisa waktu dalam detik saat disave/keluar
    last_question INTEGER DEFAULT 0, -- indeks soal terakhir yang dilihat
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Selesai'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat tabel asesmen_jawaban
CREATE TABLE public.asesmen_jawaban (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.asesmen_session(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES public.bank_soal(id) ON DELETE CASCADE,
    jawaban TEXT,
    benar BOOLEAN,
    skor NUMERIC(5,2),
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, soal_id)
);

-- Atur Row Level Security (RLS)
ALTER TABLE public.asesmen_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asesmen_jawaban ENABLE ROW LEVEL SECURITY;

-- Admin dan Koordinator punya akses penuh
CREATE POLICY "Admin and Coordinator full access to asesmen_session" ON public.asesmen_session
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

CREATE POLICY "Admin and Coordinator full access to asesmen_jawaban" ON public.asesmen_jawaban
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'koordinator', 'coordinator')
        )
    );

-- Policy untuk guru: bisa membaca dan membuat session mereka sendiri
CREATE POLICY "Guru access own asesmen_session" ON public.asesmen_session
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.peserta_asesmen pa
            JOIN public.teacher_profiles tp ON pa.guru_id = tp.id
            WHERE pa.id = asesmen_session.peserta_asesmen_id
            AND tp.user_id = auth.uid()
        )
    );

-- Policy untuk guru: bisa membuat dan mengupdate jawaban di session mereka sendiri
CREATE POLICY "Guru access own asesmen_jawaban" ON public.asesmen_jawaban
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.asesmen_session seq
            JOIN public.peserta_asesmen pa ON seq.peserta_asesmen_id = pa.id
            JOIN public.teacher_profiles tp ON pa.guru_id = tp.id
            WHERE seq.id = asesmen_jawaban.session_id
            AND tp.user_id = auth.uid()
        )
    );

-- Trigger untuk update status peserta saat session dibuat/selesai
CREATE OR REPLACE FUNCTION public.handle_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.peserta_asesmen 
        SET status = 'Sedang Mengerjakan', waktu_mulai = NEW.started_at
        WHERE id = NEW.peserta_asesmen_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Selesai' AND OLD.status != 'Selesai' THEN
        UPDATE public.peserta_asesmen 
        SET status = 'Selesai', waktu_selesai = NEW.finished_at
        WHERE id = NEW.peserta_asesmen_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_peserta_status
AFTER INSERT OR UPDATE ON public.asesmen_session
FOR EACH ROW
EXECUTE FUNCTION public.handle_session_status_change();

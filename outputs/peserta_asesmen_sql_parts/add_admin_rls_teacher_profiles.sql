-- Script untuk memberikan hak akses penuh (bisa Insert/Update/Delete/Select)
-- bagi akun yang memiliki role 'admin' ke dalam tabel teacher_profiles.

-- Pastikan RLS (Row Level Security) sudah aktif di tabel teacher_profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Buat policy baru (jika sebelumnya sudah ada dengan nama yang sama, hapus dulu agar tidak error)
DROP POLICY IF EXISTS "Admin has full access to teacher_profiles" ON public.teacher_profiles;

CREATE POLICY "Admin has full access to teacher_profiles" 
ON public.teacher_profiles
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);
-- Tambahkan kolom is_read_by_admin untuk melacak apakah akun pendaftar baru sudah dibaca oleh admin
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_read_by_admin BOOLEAN DEFAULT false;

-- Update data yang sudah ada menjadi true agar admin tidak dibombardir notifikasi "Belum Terbaca" 
-- untuk user yang sudah lama mendaftar
UPDATE public.profiles
SET is_read_by_admin = true
WHERE is_read_by_admin = false;

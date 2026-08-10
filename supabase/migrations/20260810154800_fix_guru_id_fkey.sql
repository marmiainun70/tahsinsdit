-- Ubah relasi foreign key guru_id agar mengarah ke user_id bukan id profil internal
-- Ini memperbaiki error foreign key constraint violation saat menyimpan snapshot kinerja

ALTER TABLE public.riwayat_kinerja_guru 
  DROP CONSTRAINT IF EXISTS riwayat_kinerja_guru_guru_id_fkey;

ALTER TABLE public.riwayat_kinerja_guru 
  ADD CONSTRAINT riwayat_kinerja_guru_guru_id_fkey 
  FOREIGN KEY (guru_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

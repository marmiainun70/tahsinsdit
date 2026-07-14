-- Fungsi untuk mengizinkan admin menghapus akun secara permanen
-- Fungsi ini berjalan dengan hak akses pembuat (SECURITY DEFINER)
-- sehingga dapat menghapus dari skema auth.users

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pastikan pemanggil adalah admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menghapus akun';
  END IF;

  -- Hapus dari auth.users (akan memicu CASCADE ke tabel profiles, user_roles, dll)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 1. Perbarui Fungsi Hapus Pengguna (delete_user)
-- Fungsi ini sekarang akan menangani foreign key constraint secara manual dengan aman.
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

  -- Hapus dependensi penugasan
  DELETE FROM public.teacher_classes WHERE teacher_id = target_user_id;
  DELETE FROM public.teacher_students WHERE teacher_id = target_user_id;
  DELETE FROM public.parents WHERE user_id = target_user_id;

  -- Tangani tabel attendance (Mencoba SET NULL, jika ditolak karena constraint NOT NULL, maka akan di-DELETE)
  BEGIN
    UPDATE public.attendance SET created_by = NULL WHERE created_by = target_user_id;
  EXCEPTION 
    WHEN not_null_violation THEN
      DELETE FROM public.attendance WHERE created_by = target_user_id;
    WHEN undefined_table THEN
      -- Abaikan jika tabel tidak ada
      NULL;
  END;

  -- Tangani tabel progress jika ada
  BEGIN
    UPDATE public.progress SET created_by = NULL WHERE created_by = target_user_id;
  EXCEPTION 
    WHEN not_null_violation THEN
      DELETE FROM public.progress WHERE created_by = target_user_id;
    WHEN undefined_table THEN
      NULL;
  END;

  -- Hapus dari auth.users (akan memicu CASCADE ke profiles, user_roles, dll jika sudah diatur)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Berikan akses execute kepada authenticated user (hanya admin yang lolos pengecekan di dalam fungsi)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

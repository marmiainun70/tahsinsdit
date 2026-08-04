-- Menambahkan role 'kepala_sekolah' ke enum app_role (jika belum ada)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kepala_sekolah';
COMMIT;

-- Memperbarui fungsi has_role agar 'kepala_sekolah' memiliki akses yang sama dengan 'admin'
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND (
      role = _role
      OR (_role = 'admin' AND role = 'kepala_sekolah')
    )
  )
$$;

-- Memastikan profile.role bisa menampung string 'kepala_sekolah' (varchar/text, jadi harusnya aman)
-- Selesai.

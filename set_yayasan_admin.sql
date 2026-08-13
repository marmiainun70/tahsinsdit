-- Script untuk mengatur akun Yayasan (ysds) sebagai 'admin 2'
DO $$ 
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Dapatkan user_id dari tabel auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'ysds' OR email = 'ysds@example.com'
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- 2. Nonaktifkan hanya trigger spesifik yang memblokir
    ALTER TABLE public.profiles DISABLE TRIGGER prevent_self_status_role_change;
    
    -- 3. Insert ke tabel profiles jika belum ada, atau update jika sudah ada
    INSERT INTO public.profiles (user_id, username, full_name, role)
    VALUES (v_user_id, 'ysds', 'Yayasan', 'admin 2')
    ON CONFLICT (user_id) DO UPDATE 
    SET role = 'admin 2', 
        username = 'ysds', 
        full_name = 'Yayasan';
        
    -- 4. Aktifkan kembali trigger
    ALTER TABLE public.profiles ENABLE TRIGGER prevent_self_status_role_change;
        
    RAISE NOTICE 'Berhasil mengatur akun Yayasan (ysds) dengan role admin 2. User ID: %', v_user_id;
  ELSE
    RAISE EXCEPTION 'User ysds tidak ditemukan di auth.users. Pastikan script pembuatan user sudah berjalan.';
  END IF;
END $$;

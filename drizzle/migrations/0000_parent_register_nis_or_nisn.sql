CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role public.app_role;
  v_parent_students jsonb := COALESCE(meta->'parent_students', '[]'::jsonb);
  v_link jsonb;
  v_student_id uuid;
  v_code text;
  v_nis text;
  v_nisn text;
BEGIN
  IF COALESCE(meta->>'role', 'guru') = 'parent' THEN
    v_role := 'parent'::public.app_role;
  ELSE
    v_role := 'guru'::public.app_role;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, username, whatsapp, role, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(meta->>'full_name'), ''), NEW.email),
    NULLIF(LOWER(TRIM(meta->>'username')), ''),
    NULLIF(TRIM(meta->>'whatsapp'), ''),
    v_role::text,
    'pending'
  );

  IF v_role = 'parent' THEN
    IF jsonb_typeof(v_parent_students) IS DISTINCT FROM 'array'
       OR jsonb_array_length(v_parent_students) = 0 THEN
      RAISE EXCEPTION 'Data anak wajib diisi minimal 1 siswa';
    END IF;

    IF (SELECT COUNT(*) FROM jsonb_array_elements(v_parent_students))
       <> (SELECT COUNT(DISTINCT item->>'student_id') FROM jsonb_array_elements(v_parent_students) AS item) THEN
      RAISE EXCEPTION 'Siswa yang sama tidak boleh dipilih dua kali';
    END IF;

    FOR v_link IN SELECT * FROM jsonb_array_elements(v_parent_students)
    LOOP
      BEGIN
        v_student_id := NULLIF(v_link->>'student_id', '')::uuid;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Data anak tidak valid. Silakan pilih ulang siswa.';
      END;

      v_code := NULLIF(TRIM(COALESCE(v_link->>'nis_or_nisn', v_link->>'nisn')), '');

      IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Data anak tidak valid. Silakan pilih ulang siswa.';
      END IF;
      IF v_code IS NULL THEN
        RAISE EXCEPTION 'NIS atau NISN anak wajib diisi untuk semua siswa.';
      END IF;

      SELECT students.nis, students.nisn INTO v_nis, v_nisn
      FROM public.students WHERE students.id = v_student_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Siswa yang dipilih tidak ditemukan.';
      END IF;

      IF NOT (v_code = v_nis OR v_code = v_nisn) THEN
        RAISE EXCEPTION 'NIS/NISN tidak cocok dengan siswa yang dipilih.';
      END IF;

      INSERT INTO public.parents (user_id, student_id, phone)
      VALUES (NEW.id, v_student_id, NULLIF(TRIM(meta->>'whatsapp'), ''))
      ON CONFLICT (user_id, student_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Pra-validasi publik: mengembalikan pesan error (bahasa Indonesia) atau NULL jika valid.
CREATE OR REPLACE FUNCTION public.check_registration(p_username text, p_links jsonb)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link jsonb;
  v_idx int := 0;
  v_code text;
  v_found boolean;
BEGIN
  IF NULLIF(LOWER(TRIM(p_username)), '') IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE username = LOWER(TRIM(p_username))
  ) THEN
    RETURN 'Username sudah dipakai. Silakan gunakan username lain.';
  END IF;

  IF p_links IS NOT NULL AND jsonb_typeof(p_links) = 'array' THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links)
    LOOP
      v_idx := v_idx + 1;
      v_code := NULLIF(TRIM(v_link->>'nis_or_nisn'), '');
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM public.students
          WHERE id = (v_link->>'student_id')::uuid
            AND v_code IS NOT NULL AND (nis = v_code OR nisn = v_code)
        ) INTO v_found;
      EXCEPTION WHEN others THEN
        v_found := false;
      END;
      IF NOT v_found THEN
        RETURN format('NIS/NISN Anak %s tidak cocok dengan siswa yang dipilih. Periksa kembali nomornya.', v_idx);
      END IF;
    END LOOP;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.check_registration(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_registration(text, jsonb) TO anon, authenticated;
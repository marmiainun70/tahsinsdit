-- Melengkapi register publik Tahsin untuk akun guru dan orang tua multi-anak.
-- Relasi memakai tabel public.parents yang sudah ada.

GRANT SELECT (id, nama, kelas, rombel) ON public.students TO anon;

DROP POLICY IF EXISTS "Public can search students for registration" ON public.students;
CREATE POLICY "Public can search students for registration"
  ON public.students
  FOR SELECT
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role public.app_role;
  v_parent_students jsonb := COALESCE(meta->'parent_students', '[]'::jsonb);
  v_link jsonb;
  v_student_id uuid;
  v_nisn text;
  v_expected_nisn text;
BEGIN
  IF COALESCE(meta->>'role', 'guru') = 'parent' THEN
    v_role := 'parent'::public.app_role;
  ELSE
    v_role := 'guru'::public.app_role;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    full_name,
    username,
    whatsapp,
    role,
    status
  )
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

    IF (
      SELECT COUNT(*)
      FROM jsonb_array_elements(v_parent_students)
    ) <> (
      SELECT COUNT(DISTINCT item->>'student_id')
      FROM jsonb_array_elements(v_parent_students) AS item
    ) THEN
      RAISE EXCEPTION 'Siswa yang sama tidak boleh dipilih dua kali';
    END IF;

    FOR v_link IN SELECT * FROM jsonb_array_elements(v_parent_students)
    LOOP
      BEGIN
        v_student_id := NULLIF(v_link->>'student_id', '')::uuid;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Data anak tidak valid. Silakan pilih ulang siswa.';
      END;

      v_nisn := NULLIF(TRIM(v_link->>'nisn'), '');
      IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Data anak tidak valid. Silakan pilih ulang siswa.';
      END IF;
      IF v_nisn IS NULL THEN
        RAISE EXCEPTION 'NISN anak wajib diisi untuk semua siswa.';
      END IF;

      SELECT students.nisn
      INTO v_expected_nisn
      FROM public.students
      WHERE students.id = v_student_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Siswa yang dipilih tidak ditemukan.';
      END IF;
      IF v_expected_nisn IS NULL OR v_nisn <> v_expected_nisn THEN
        RAISE EXCEPTION 'NISN tidak cocok dengan siswa yang dipilih.';
      END IF;

      INSERT INTO public.parents (user_id, student_id, phone)
      VALUES (NEW.id, v_student_id, NULLIF(TRIM(meta->>'whatsapp'), ''))
      ON CONFLICT (user_id, student_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_approved_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.role = 'parent' THEN
      v_role := 'parent'::public.app_role;
    ELSE
      v_role := 'guru'::public.app_role;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_managed_accounts()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  whatsapp text,
  role text,
  status text,
  registered_at timestamptz,
  is_read_by_admin boolean,
  children text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melihat daftar akun';
  END IF;

  RETURN QUERY
  WITH parent_children AS (
    SELECT
      x.user_id,
      COALESCE(array_agg(x.child_label ORDER BY x.child_label), '{}'::text[]) AS children
    FROM (
      SELECT DISTINCT
        pa.user_id,
        format('%s (%s%s)', s.nama, s.kelas, COALESCE(s.rombel, '')) AS child_label
      FROM public.parents pa
      JOIN public.students s ON s.id = pa.student_id
    ) x
    GROUP BY x.user_id
  )
  SELECT
    ids.user_id,
    COALESCE(
      NULLIF(BTRIM(ps.full_name), ''),
      NULLIF(BTRIM(tp.full_name), ''),
      NULLIF(BTRIM(u.raw_user_meta_data->>'full_name'), ''),
      NULLIF(BTRIM(u.raw_user_meta_data->>'name'), ''),
      NULLIF(BTRIM(u.email), ''),
      'Pengguna'
    ) AS full_name,
    NULLIF(BTRIM(ps.username), '') AS username,
    NULLIF(BTRIM(ps.whatsapp), '') AS whatsapp,
    COALESCE(
      NULLIF(BTRIM(ps.role), ''),
      NULLIF(BTRIM(ur.role::text), ''),
      CASE
        WHEN tp.user_id IS NOT NULL THEN 'guru'
        WHEN pc.user_id IS NOT NULL THEN 'parent'
        ELSE 'guru'
      END
    ) AS role,
    COALESCE(NULLIF(BTRIM(ps.status), ''), 'approved') AS status,
    COALESCE(ps.registered_at, tp.created_at, u.created_at, now()) AS registered_at,
    COALESCE(ps.is_read_by_admin, true) AS is_read_by_admin,
    COALESCE(pc.children, '{}'::text[]) AS children
  FROM (
    SELECT user_id FROM public.profiles
    UNION
    SELECT user_id FROM public.user_roles
    UNION
    SELECT user_id FROM public.teacher_profiles
    UNION
    SELECT user_id FROM public.parents
  ) ids
  LEFT JOIN public.profiles ps ON ps.user_id = ids.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = ids.user_id
  LEFT JOIN public.teacher_profiles tp ON tp.user_id = ids.user_id
  LEFT JOIN parent_children pc ON pc.user_id = ids.user_id
  LEFT JOIN auth.users u ON u.id = ids.user_id
  ORDER BY COALESCE(ps.registered_at, tp.created_at, u.created_at, now()) DESC, full_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_managed_accounts() TO authenticated;

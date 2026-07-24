-- Backfill nama profil lama yang masih kosong atau masih memakai placeholder.
-- Ini membantu menu Manajemen Akun menampilkan nama asli tanpa menunggu akun login ulang.

WITH resolved_names AS (
  SELECT
    p.user_id,
    COALESCE(
      NULLIF(BTRIM(p.full_name), ''),
      NULLIF(BTRIM(tp.full_name), ''),
      NULLIF(BTRIM(u.raw_user_meta_data->>'full_name'), ''),
      NULLIF(BTRIM(u.raw_user_meta_data->>'name'), ''),
      NULLIF(BTRIM(u.email), '')
    ) AS resolved_full_name
  FROM public.profiles p
  LEFT JOIN public.teacher_profiles tp ON tp.user_id = p.user_id
  LEFT JOIN auth.users u ON u.id = p.user_id
)
UPDATE public.profiles p
SET full_name = rn.resolved_full_name
FROM resolved_names rn
WHERE p.user_id = rn.user_id
  AND rn.resolved_full_name IS NOT NULL
  AND BTRIM(rn.resolved_full_name) <> ''
  AND (
    p.full_name IS NULL
    OR BTRIM(p.full_name) = ''
    OR LOWER(BTRIM(p.full_name)) = 'pengguna'
  );


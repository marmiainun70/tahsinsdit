-- Fix RLS for riwayat_kinerja_guru to include check on profiles.role
-- This prevents issues where user_roles table is out of sync for some admin users

DROP POLICY IF EXISTS "Admin can view riwayat kinerja guru" ON public.riwayat_kinerja_guru;
DROP POLICY IF EXISTS "Admin can manage riwayat kinerja guru" ON public.riwayat_kinerja_guru;

CREATE POLICY "Admin can view riwayat kinerja guru"
ON public.riwayat_kinerja_guru FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admin can manage riwayat kinerja guru"
ON public.riwayat_kinerja_guru FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

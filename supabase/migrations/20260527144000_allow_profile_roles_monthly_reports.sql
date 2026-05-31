-- Allow monthly report writes when the logged-in user's profile role is admin/guru.
-- This keeps the existing user_roles policies, but fixes accounts whose profiles.role
-- is already admin/guru while user_roles is missing or not synced.

DROP POLICY IF EXISTS "Profile role can insert monthly reports" ON public.monthly_reports;
DROP POLICY IF EXISTS "Profile role can update monthly reports" ON public.monthly_reports;

CREATE POLICY "Profile role can insert monthly reports"
ON public.monthly_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'guru')
  )
);

CREATE POLICY "Profile role can update monthly reports"
ON public.monthly_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'guru')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'guru')
  )
);

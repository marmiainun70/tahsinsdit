CREATE OR REPLACE FUNCTION public.is_admin_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = _user_id
        AND status = 'approved'
        AND role = 'admin'
    );
$$;

DROP POLICY IF EXISTS "Spreadsheet layouts readable by authenticated users" ON public.spreadsheet_layout_settings;
CREATE POLICY "Spreadsheet layouts readable by authenticated users"
ON public.spreadsheet_layout_settings
FOR SELECT TO authenticated
USING (
  scope = 'global'
  OR user_id = auth.uid()
  OR public.is_admin_account(auth.uid())
);

DROP POLICY IF EXISTS "Admin manages global spreadsheet layouts" ON public.spreadsheet_layout_settings;
CREATE POLICY "Admin manages global spreadsheet layouts"
ON public.spreadsheet_layout_settings
FOR ALL TO authenticated
USING (
  scope = 'global'
  AND public.is_admin_account(auth.uid())
)
WITH CHECK (
  scope = 'global'
  AND user_id IS NULL
  AND public.is_admin_account(auth.uid())
);

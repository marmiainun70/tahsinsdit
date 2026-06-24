CREATE TABLE IF NOT EXISTS public.spreadsheet_layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('global', 'personal')),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spreadsheet_layout_personal_has_user CHECK (
    (scope = 'global' AND user_id IS NULL)
    OR (scope = 'personal' AND user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS spreadsheet_layout_settings_global_unique
  ON public.spreadsheet_layout_settings (page_key, scope)
  WHERE scope = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS spreadsheet_layout_settings_personal_unique
  ON public.spreadsheet_layout_settings (page_key, scope, user_id)
  WHERE scope = 'personal';

CREATE OR REPLACE FUNCTION public.touch_spreadsheet_layout_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spreadsheet_layout_settings_touch_updated_at ON public.spreadsheet_layout_settings;
CREATE TRIGGER spreadsheet_layout_settings_touch_updated_at
BEFORE UPDATE ON public.spreadsheet_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_spreadsheet_layout_settings_updated_at();

ALTER TABLE public.spreadsheet_layout_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spreadsheet layouts readable by authenticated users" ON public.spreadsheet_layout_settings;
CREATE POLICY "Spreadsheet layouts readable by authenticated users"
ON public.spreadsheet_layout_settings
FOR SELECT TO authenticated
USING (
  scope = 'global'
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admin manages global spreadsheet layouts" ON public.spreadsheet_layout_settings;
CREATE POLICY "Admin manages global spreadsheet layouts"
ON public.spreadsheet_layout_settings
FOR ALL TO authenticated
USING (
  scope = 'global'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  scope = 'global'
  AND user_id IS NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Teachers manage own spreadsheet layouts" ON public.spreadsheet_layout_settings;
CREATE POLICY "Teachers manage own spreadsheet layouts"
ON public.spreadsheet_layout_settings
FOR ALL TO authenticated
USING (
  scope = 'personal'
  AND user_id = auth.uid()
  AND public.is_teacher_account(auth.uid())
)
WITH CHECK (
  scope = 'personal'
  AND user_id = auth.uid()
  AND public.is_teacher_account(auth.uid())
);

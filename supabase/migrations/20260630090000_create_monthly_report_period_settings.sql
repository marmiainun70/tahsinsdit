CREATE TABLE IF NOT EXISTS public.monthly_report_period_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_iqra INTEGER NOT NULL DEFAULT 0 CHECK (target_iqra >= 0),
  target_tahsin_lanjutan INTEGER NOT NULL DEFAULT 0 CHECK (target_tahsin_lanjutan >= 0),
  target_tahfizh INTEGER NOT NULL DEFAULT 0 CHECK (target_tahfizh >= 0),
  effective_days INTEGER NOT NULL DEFAULT 0 CHECK (effective_days >= 0),
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (month, year)
);

ALTER TABLE public.monthly_report_period_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Monthly report period settings readable by authenticated"
ON public.monthly_report_period_settings;

CREATE POLICY "Monthly report period settings readable by authenticated"
ON public.monthly_report_period_settings
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin can insert monthly report period settings"
ON public.monthly_report_period_settings;

CREATE POLICY "Admin can insert monthly report period settings"
ON public.monthly_report_period_settings
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_account(auth.uid()));

DROP POLICY IF EXISTS "Admin can update monthly report period settings"
ON public.monthly_report_period_settings;

CREATE POLICY "Admin can update monthly report period settings"
ON public.monthly_report_period_settings
FOR UPDATE TO authenticated
USING (public.is_admin_account(auth.uid()))
WITH CHECK (public.is_admin_account(auth.uid()));

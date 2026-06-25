CREATE TABLE IF NOT EXISTS public.attendance_period_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  kelas INTEGER NOT NULL CHECK (kelas BETWEEN 1 AND 6),
  rombel TEXT NOT NULL CHECK (rombel IN ('A', 'B', 'C', 'D')),
  effective_days INTEGER NOT NULL DEFAULT 0 CHECK (effective_days >= 0),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  locked_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (month, year, kelas, rombel)
);

ALTER TABLE public.attendance_period_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance period settings readable by authenticated"
ON public.attendance_period_settings;

CREATE POLICY "Attendance period settings readable by authenticated"
ON public.attendance_period_settings
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Guru and admin can insert attendance period settings"
ON public.attendance_period_settings;

CREATE POLICY "Guru and admin can insert attendance period settings"
ON public.attendance_period_settings
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_account(auth.uid())
  OR public.has_role(auth.uid(), 'guru'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND status = 'approved'
      AND role NOT IN ('admin', 'parent')
  )
);

DROP POLICY IF EXISTS "Guru and admin can update unlocked attendance period settings"
ON public.attendance_period_settings;

CREATE POLICY "Guru and admin can update unlocked attendance period settings"
ON public.attendance_period_settings
FOR UPDATE TO authenticated
USING (
  public.is_admin_account(auth.uid())
  OR (
    is_locked = false
    AND (
      public.has_role(auth.uid(), 'guru'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = auth.uid()
          AND status = 'approved'
          AND role NOT IN ('admin', 'parent')
      )
    )
  )
)
WITH CHECK (
  public.is_admin_account(auth.uid())
  OR (
    is_locked = false
    AND locked_by IS NULL
    AND locked_at IS NULL
    AND (
      public.has_role(auth.uid(), 'guru'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = auth.uid()
          AND status = 'approved'
          AND role NOT IN ('admin', 'parent')
      )
    )
  )
);

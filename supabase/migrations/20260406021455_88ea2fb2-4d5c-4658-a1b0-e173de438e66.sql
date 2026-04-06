
-- Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'guru', 'parent');

-- Create user_roles table (separate from profiles per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create parents table (link parent user to student)
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, student_id)
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links" ON public.parents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins and guru can view all parents" ON public.parents
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

CREATE POLICY "Admins can manage parents" ON public.parents
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create monthly_reports table
CREATE TABLE public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  program_type TEXT NOT NULL DEFAULT 'iqra',
  iqra_level TEXT DEFAULT NULL,
  start_page INTEGER NOT NULL DEFAULT 1,
  end_page INTEGER NOT NULL DEFAULT 1,
  pages_read INTEGER NOT NULL DEFAULT 0,
  target_pages INTEGER NOT NULL DEFAULT 20,
  achievement_status TEXT NOT NULL DEFAULT 'not_achieved',
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, month, year)
);
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monthly reports viewable by authenticated" ON public.monthly_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Guru and admin can insert monthly reports" ON public.monthly_reports
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

CREATE POLICY "Guru and admin can update monthly reports" ON public.monthly_reports
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

CREATE POLICY "Guru and admin can delete monthly reports" ON public.monthly_reports
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  present INTEGER NOT NULL DEFAULT 0,
  sick INTEGER NOT NULL DEFAULT 0,
  permission INTEGER NOT NULL DEFAULT 0,
  absent INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, month, year)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance viewable by authenticated" ON public.attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Guru and admin can insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

CREATE POLICY "Guru and admin can update attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

CREATE POLICY "Guru and admin can delete attendance" ON public.attendance
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru')
  );

-- Assign existing users the 'guru' role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'guru'::app_role FROM public.profiles
ON CONFLICT DO NOTHING;

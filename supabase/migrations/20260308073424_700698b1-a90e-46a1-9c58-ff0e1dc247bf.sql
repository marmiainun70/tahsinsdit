
-- ENUM TYPES
CREATE TYPE public.reading_level AS ENUM (
  'Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6',
  'Tahsin Dasar', 'Tahsin Lanjutan', 'Tahfizh'
);

CREATE TYPE public.reading_status AS ENUM (
  'Lancar', 'Cukup', 'Perlu Latihan', 'Terbata-bata'
);

CREATE TYPE public.exam_result AS ENUM ('Lulus', 'Tidak Lulus');

-- PROFILES TABLE (teachers/admins)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'guru',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- STUDENTS TABLE
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  kelas INTEGER NOT NULL CHECK (kelas BETWEEN 1 AND 6),
  level reading_level NOT NULL DEFAULT 'Iqro 1',
  halaman_terakhir INTEGER NOT NULL DEFAULT 1,
  status_bacaan reading_status NOT NULL DEFAULT 'Terbata-bata',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students viewable by authenticated users"
  ON public.students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE TO authenticated USING (true);

-- PROGRESS ENTRIES TABLE
CREATE TABLE public.progress_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  buku TEXT NOT NULL,
  halaman INTEGER NOT NULL,
  kelancaran INTEGER NOT NULL CHECK (kelancaran BETWEEN 0 AND 100),
  makhraj INTEGER NOT NULL CHECK (makhraj BETWEEN 0 AND 100),
  tajwid INTEGER NOT NULL CHECK (tajwid BETWEEN 0 AND 100),
  catatan TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Progress viewable by authenticated users"
  ON public.progress_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert progress"
  ON public.progress_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update progress"
  ON public.progress_entries FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete progress"
  ON public.progress_entries FOR DELETE TO authenticated USING (true);

-- EXAM RECORDS TABLE
CREATE TABLE public.exam_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  level_diuji reading_level NOT NULL,
  kelancaran INTEGER NOT NULL CHECK (kelancaran BETWEEN 0 AND 100),
  makhraj INTEGER NOT NULL CHECK (makhraj BETWEEN 0 AND 100),
  tajwid INTEGER NOT NULL CHECK (tajwid BETWEEN 0 AND 100),
  adab INTEGER NOT NULL CHECK (adab BETWEEN 0 AND 100),
  kesalahan_makhraj INTEGER NOT NULL DEFAULT 0,
  kesalahan_tajwid INTEGER NOT NULL DEFAULT 0,
  terhenti INTEGER NOT NULL DEFAULT 0,
  dibantu_guru INTEGER NOT NULL DEFAULT 0,
  catatan TEXT DEFAULT '',
  hasil exam_result NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams viewable by authenticated users"
  ON public.exam_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert exams"
  ON public.exam_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update exams"
  ON public.exam_records FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete exams"
  ON public.exam_records FOR DELETE TO authenticated USING (true);

-- TRIGGER FUNCTION for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INDEXES
CREATE INDEX idx_students_kelas ON public.students(kelas);
CREATE INDEX idx_students_level ON public.students(level);
CREATE INDEX idx_progress_student ON public.progress_entries(student_id);
CREATE INDEX idx_exams_student ON public.exam_records(student_id);

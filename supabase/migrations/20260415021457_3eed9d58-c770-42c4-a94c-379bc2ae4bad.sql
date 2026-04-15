
-- Tahsin Dasar exams
CREATE TABLE public.tahsin_dasar_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu TIME NOT NULL DEFAULT LOCALTIME,
  created_by UUID,
  lahn_jali_penalty INTEGER NOT NULL DEFAULT 2,
  lahn_khofi_penalty INTEGER NOT NULL DEFAULT 1,
  kelancaran_bobot INTEGER NOT NULL DEFAULT 40,
  ebta_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  nilai_akhir NUMERIC NOT NULL DEFAULT 0,
  hasil TEXT NOT NULL DEFAULT 'Tidak Lulus',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tahsin_dasar_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tahsin dasar exams viewable by authenticated"
  ON public.tahsin_dasar_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Guru and admin can insert tahsin dasar exams"
  ON public.tahsin_dasar_exams FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));
CREATE POLICY "Guru and admin can update tahsin dasar exams"
  ON public.tahsin_dasar_exams FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));
CREATE POLICY "Guru and admin can delete tahsin dasar exams"
  ON public.tahsin_dasar_exams FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));

-- Tahsin Lanjutan exams
CREATE TABLE public.tahsin_lanjutan_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu TIME NOT NULL DEFAULT LOCALTIME,
  created_by UUID,
  lahn_jali_penalty INTEGER NOT NULL DEFAULT 2,
  lahn_khofi_penalty INTEGER NOT NULL DEFAULT 1,
  waqaf_ibtida_penalty INTEGER NOT NULL DEFAULT 2,
  kelancaran_bobot INTEGER NOT NULL DEFAULT 40,
  soal JSONB NOT NULL DEFAULT '[]'::jsonb,
  waqaf_symbols JSONB NOT NULL DEFAULT '{}'::jsonb,
  waqaf_lulus BOOLEAN NOT NULL DEFAULT false,
  nilai_akhir NUMERIC NOT NULL DEFAULT 0,
  hasil TEXT NOT NULL DEFAULT 'Tidak Lulus',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tahsin_lanjutan_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tahsin lanjutan exams viewable by authenticated"
  ON public.tahsin_lanjutan_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Guru and admin can insert tahsin lanjutan exams"
  ON public.tahsin_lanjutan_exams FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));
CREATE POLICY "Guru and admin can update tahsin lanjutan exams"
  ON public.tahsin_lanjutan_exams FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));
CREATE POLICY "Guru and admin can delete tahsin lanjutan exams"
  ON public.tahsin_lanjutan_exams FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'guru'::app_role));

CREATE TABLE public.tahsin_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  makhraj_huruf INTEGER NOT NULL DEFAULT 0,
  hukum_nun_mati INTEGER NOT NULL DEFAULT 0,
  hukum_mim_mati INTEGER NOT NULL DEFAULT 0,
  mad INTEGER NOT NULL DEFAULT 0,
  tartil INTEGER NOT NULL DEFAULT 0,
  nilai_total INTEGER NOT NULL DEFAULT 0,
  predikat TEXT NOT NULL DEFAULT 'Maqbul',
  keterangan JSONB DEFAULT '{}',
  catatan TEXT DEFAULT '',
  level_dinilai TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tahsin_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tahsin assessments viewable by authenticated users"
  ON public.tahsin_assessments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tahsin assessments"
  ON public.tahsin_assessments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tahsin assessments"
  ON public.tahsin_assessments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tahsin assessments"
  ON public.tahsin_assessments FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_tahsin_assessments_updated_at
  BEFORE UPDATE ON public.tahsin_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tahsin_assessments_student_id ON public.tahsin_assessments(student_id);
CREATE INDEX idx_tahsin_assessments_tanggal ON public.tahsin_assessments(tanggal DESC);
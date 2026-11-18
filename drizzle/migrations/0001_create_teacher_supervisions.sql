CREATE TABLE public.teacher_supervisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id uuid NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  supervision_date date NOT NULL DEFAULT CURRENT_DATE,
  class_label text,
  material text,
  supervisor_id uuid,
  supervisor_name text,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  observations jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score integer NOT NULL DEFAULT 0,
  final_score numeric NOT NULL DEFAULT 0,
  predicate text NOT NULL DEFAULT '-',
  strengths_note text,
  improvement_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_supervisions TO authenticated;
GRANT ALL ON public.teacher_supervisions TO service_role;
ALTER TABLE public.teacher_supervisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Diagnostic admins manage supervisions" ON public.teacher_supervisions
  FOR ALL TO authenticated
  USING (public.is_teacher_diagnostic_admin(auth.uid()))
  WITH CHECK (public.is_teacher_diagnostic_admin(auth.uid()));
CREATE POLICY "Teachers view own supervisions" ON public.teacher_supervisions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teacher_profiles tp WHERE tp.id = teacher_profile_id AND tp.user_id = auth.uid()));
CREATE INDEX teacher_supervisions_profile_idx ON public.teacher_supervisions(teacher_profile_id, supervision_date DESC);
CREATE TRIGGER teacher_supervisions_updated_at BEFORE UPDATE ON public.teacher_supervisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
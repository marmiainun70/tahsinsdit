
CREATE TYPE public.activity_type AS ENUM (
  'pindah_rombel',
  'lulus_ujian',
  'tidak_lulus_ujian',
  'nilai_rendah',
  'catatan_progres',
  'naik_level'
);

CREATE TABLE public.activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by  uuid NULL,
  activity_type activity_type NOT NULL,
  judul       text NOT NULL,
  deskripsi   text NULL,
  metadata    jsonb NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity logs viewable by authenticated users"
  ON public.activity_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activity logs"
  ON public.activity_logs FOR DELETE
  TO authenticated USING (true);

-- Institution settings (single row, admin-managed)
CREATE TABLE IF NOT EXISTS public.institution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lembaga text NOT NULL DEFAULT 'SDIT',
  alamat text NOT NULL DEFAULT '',
  logo_url text,
  koordinator_nama text NOT NULL DEFAULT '',
  koordinator_ttd_url text,
  kepsek_nama text NOT NULL DEFAULT '',
  kepsek_ttd_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated"
  ON public.institution_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert settings"
  ON public.institution_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update settings"
  ON public.institution_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete settings"
  ON public.institution_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed one default row
INSERT INTO public.institution_settings (nama_lembaga, alamat)
SELECT 'SDIT', ''
WHERE NOT EXISTS (SELECT 1 FROM public.institution_settings);

-- Public bucket for logos & signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('institution', 'institution', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Institution assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'institution');

CREATE POLICY "Admin upload institution assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'institution' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update institution assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'institution' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete institution assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'institution' AND has_role(auth.uid(), 'admin'::app_role));
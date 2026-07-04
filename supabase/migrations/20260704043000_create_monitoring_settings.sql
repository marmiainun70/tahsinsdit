CREATE TABLE public.monitoring_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ipp_trend_threshold NUMERIC NOT NULL DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Memastikan hanya ada 1 baris (id = 1)
ALTER TABLE public.monitoring_settings ADD CONSTRAINT monitoring_settings_id_check CHECK (id = 1);

-- Default data
INSERT INTO public.monitoring_settings (id, ipp_trend_threshold) VALUES (1, 5) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.monitoring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin dapat melihat monitoring settings"
    ON public.monitoring_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin dapat mengubah monitoring settings"
    ON public.monitoring_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App settings are publicly readable" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.app_settings (setting_key, setting_value) VALUES ('admin_phones', '[]');

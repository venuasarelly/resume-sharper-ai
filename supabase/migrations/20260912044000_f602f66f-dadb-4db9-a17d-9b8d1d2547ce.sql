CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  resume_profile_id uuid REFERENCES public.resume_profiles(id) ON DELETE SET NULL,
  job_analysis_id uuid REFERENCES public.job_analyses(id) ON DELETE SET NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'Workday',
  job_url text,
  status text NOT NULL DEFAULT 'draft',
  match_score integer NOT NULL DEFAULT 0,
  notes text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  applied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo app: anyone can read applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Demo app: anyone can add applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo app: anyone can update applications" ON public.applications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo app: anyone can remove applications" ON public.applications FOR DELETE USING (true);
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX applications_created_at_idx ON public.applications (created_at DESC);

CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid UNIQUE,
  full_name text,
  email text,
  location text,
  min_match_score integer NOT NULL DEFAULT 70,
  auto_submit boolean NOT NULL DEFAULT false,
  generate_cover_letter boolean NOT NULL DEFAULT true,
  job_alerts boolean NOT NULL DEFAULT true,
  weekly_summary boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo app: anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Demo app: anyone can add settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo app: anyone can update settings" ON public.app_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo app: anyone can remove settings" ON public.app_settings FOR DELETE USING (true);
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (user_id) VALUES ('00000000-0000-0000-0000-000000000000'::uuid);
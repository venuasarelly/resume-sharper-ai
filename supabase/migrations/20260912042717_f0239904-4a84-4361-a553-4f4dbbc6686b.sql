CREATE TABLE public.resume_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  raw_text TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  headline TEXT,
  summary TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_profiles TO authenticated;
GRANT ALL ON public.resume_profiles TO service_role;

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo app: anyone can read resumes" ON public.resume_profiles FOR SELECT USING (true);
CREATE POLICY "Demo app: anyone can add resumes" ON public.resume_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo app: anyone can update resumes" ON public.resume_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo app: anyone can remove resumes" ON public.resume_profiles FOR DELETE USING (true);

CREATE TABLE public.job_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  resume_profile_id UUID REFERENCES public.resume_profiles(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_description TEXT NOT NULL DEFAULT '',
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_required TEXT,
  education_required TEXT,
  match_score INTEGER NOT NULL DEFAULT 0,
  matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_match TEXT,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT ALL ON public.job_analyses TO service_role;

ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo app: anyone can read job analyses" ON public.job_analyses FOR SELECT USING (true);
CREATE POLICY "Demo app: anyone can add job analyses" ON public.job_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo app: anyone can update job analyses" ON public.job_analyses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo app: anyone can remove job analyses" ON public.job_analyses FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_resume_profiles_updated_at BEFORE UPDATE ON public.resume_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_analyses_updated_at BEFORE UPDATE ON public.job_analyses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_resume_profiles_created_at ON public.resume_profiles (created_at DESC);
CREATE INDEX idx_job_analyses_created_at ON public.job_analyses (created_at DESC);
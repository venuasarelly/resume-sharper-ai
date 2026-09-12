CREATE TABLE public.resume_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  error_message text,
  raw_text text,
  full_name text,
  email text,
  phone text,
  location text,
  headline text,
  summary text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  skills text[] NOT NULL DEFAULT '{}',
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_profiles TO authenticated;
GRANT ALL ON public.resume_profiles TO service_role;

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume profiles"
  ON public.resume_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resume profiles"
  ON public.resume_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resume profiles"
  ON public.resume_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume profiles"
  ON public.resume_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX resume_profiles_user_created_idx ON public.resume_profiles (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER resume_profiles_set_updated_at
BEFORE UPDATE ON public.resume_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read their own resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
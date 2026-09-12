CREATE TABLE public.job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  job_description text NOT NULL,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  responsibilities text[] NOT NULL DEFAULT '{}',
  experience_required text,
  education_required text,
  match_score integer NOT NULL DEFAULT 0,
  matching_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  experience_match text,
  recommendations text[] NOT NULL DEFAULT '{}',
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT ALL ON public.job_analyses TO service_role;

ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own job analyses" ON public.job_analyses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own job analyses" ON public.job_analyses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own job analyses" ON public.job_analyses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own job analyses" ON public.job_analyses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX job_analyses_user_created_idx ON public.job_analyses (user_id, created_at DESC);
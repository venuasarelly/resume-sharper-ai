import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Demo mode: no sign-in. All analyses are shared. */
const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const AnalyzeInput = z.object({
  jobTitle: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  jobDescription: z.string().min(30).max(50_000),
});

export interface JobAnalysisRecord {
  id: string;
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  responsibilities: string[];
  experienceRequired: string | null;
  educationRequired: string | null;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: string | null;
  recommendations: string[];
  summary: string | null;
  createdAt: string;
}

function toRecord(row: Record<string, unknown>): JobAnalysisRecord {
  const list = (key: string) => (row[key] as string[] | null) ?? [];
  return {
    id: String(row['id']),
    jobTitle: String(row['job_title']),
    company: String(row['company']),
    requiredSkills: list('required_skills'),
    preferredSkills: list('preferred_skills'),
    keywords: list('keywords'),
    responsibilities: list('responsibilities'),
    experienceRequired: (row['experience_required'] as string | null) ?? null,
    educationRequired: (row['education_required'] as string | null) ?? null,
    matchScore: Number(row['match_score'] ?? 0),
    matchingSkills: list('matching_skills'),
    missingSkills: list('missing_skills'),
    experienceMatch: (row['experience_match'] as string | null) ?? null,
    recommendations: list('recommendations'),
    summary: (row['summary'] as string | null) ?? null,
    createdAt: String(row['created_at']),
  };
}

/** Saved job analyses for the signed-in user, newest first. */
export const listJobAnalyses = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = await adminClient();
    const { data, error } = await supabase
      .from("job_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toRecord(row as Record<string, unknown>));
  });

/** Extracts job requirements with AI, compares to the saved resume and stores the result. */
export const analyzeJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = await adminClient();
    const resumeQuery = await supabase
      .from("resume_profiles")
      .select("headline, summary, skills, experience, education, certifications")
      .eq("status", "parsed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (resumeQuery.error) throw new Error(resumeQuery.error.message);

    const row = resumeQuery.data as Record<string, unknown> | null;
    const resume = row
      ? {
          headline: (row['headline'] as string | null) ?? null,
          summary: (row['summary'] as string | null) ?? null,
          skills: (row['skills'] as string[] | null) ?? [],
          experience: (row['experience'] as never) ?? [],
          education: (row['education'] as never) ?? [],
          certifications: (row['certifications'] as never) ?? [],
        }
      : null;

    const { analyzeJobPosting } = await import("./job.server");
    const result = await analyzeJobPosting({ ...data, resume });

    const insert = await supabase
      .from("job_analyses")
      .insert({
        user_id: SHARED_OWNER_ID,
        job_title: data.jobTitle,
        company: data.company,
        job_description: data.jobDescription,
        required_skills: result.requiredSkills,
        preferred_skills: result.preferredSkills,
        keywords: result.keywords,
        responsibilities: result.responsibilities,
        experience_required: result.experienceRequired,
        education_required: result.educationRequired,
        match_score: result.matchScore,
        matching_skills: result.matchingSkills,
        missing_skills: result.missingSkills,
        experience_match: result.experienceMatch,
        recommendations: result.recommendations,
        summary: result.summary,
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    return {
      analysis: toRecord(insert.data as Record<string, unknown>),
      hasResume: resume !== null,
    };
  });

/**
 * Server-only helpers: extract structured requirements from a job posting and
 * compare them with a saved resume profile using Lovable AI.
 */

export interface JobExtraction {
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  responsibilities: string[];
  experienceRequired: string | null;
  educationRequired: string | null;
}

export interface JobComparison {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: string | null;
  recommendations: string[];
  summary: string | null;
}

export interface JobAnalysisResult extends JobExtraction, JobComparison {}

export interface ResumeSnapshot {
  headline: string | null;
  summary: string | null;
  skills: string[];
  experience: { company: string; role: string; period: string; highlights: string[] }[];
  education: { school: string; degree: string; period: string }[];
  certifications?: { name: string; issuer: string | null; year: string | null }[];
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "requiredSkills",
    "preferredSkills",
    "keywords",
    "responsibilities",
    "experienceRequired",
    "educationRequired",
    "matchScore",
    "matchingSkills",
    "missingSkills",
    "experienceMatch",
    "recommendations",
    "summary",
  ],
  properties: {
    requiredSkills: { type: "array", items: { type: "string" } },
    preferredSkills: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
    responsibilities: { type: "array", items: { type: "string" } },
    experienceRequired: { type: ["string", "null"] },
    educationRequired: { type: ["string", "null"] },
    matchScore: { type: "integer" },
    matchingSkills: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
    experienceMatch: { type: ["string", "null"] },
    recommendations: { type: "array", items: { type: "string" } },
    summary: { type: ["string", "null"] },
  },
} as const;

function clampList(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, max)
    : [];
}

export async function analyzeJobPosting(input: {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resume: ResumeSnapshot | null;
}): Promise<JobAnalysisResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app yet.");

  const resumeText = input.resume
    ? JSON.stringify(input.resume).slice(0, 20_000)
    : "NO RESUME ON FILE";

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            "You analyse job postings and compare them with a candidate's resume. First extract the posting's required skills, preferred skills, keywords (ATS terms), responsibilities, years of experience required and education required. Then compare with the resume: matchScore is an integer 0-100 weighing required skills most heavily, then experience, then education and preferred skills. matchingSkills are resume skills that satisfy posting requirements; missingSkills are posting requirements absent from the resume. recommendations are 3-6 short, concrete actions the candidate can take. Use only information present in the inputs, never invent employers, dates or skills, and use null when something is not stated. If there is no resume on file, set matchScore to 0, leave matching skills empty and say so in the summary.",
        },
        {
          role: "user",
          content: `Job title: ${input.jobTitle}\nCompany: ${input.company}\n\nJob description:\n${input.jobDescription.slice(0, 30_000)}\n\nCandidate resume profile (JSON):\n${resumeText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "job_analysis", strict: true, schema: SCHEMA },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`AI gateway error [${response.status}]: ${body}`);
    if (response.status === 429) throw new Error("AI is busy right now. Please try again shortly.");
    if (response.status === 402)
      throw new Error("AI credits are exhausted. Add credits to continue analysing jobs.");
    throw new Error(`Job analysis failed (status ${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Job analysis returned an empty result.");

  let parsed: Partial<JobAnalysisResult>;
  try {
    parsed = JSON.parse(content) as Partial<JobAnalysisResult>;
  } catch {
    throw new Error("Job analysis returned an unreadable result.");
  }

  const score = Number(parsed.matchScore);
  return {
    requiredSkills: clampList(parsed.requiredSkills, 40),
    preferredSkills: clampList(parsed.preferredSkills, 40),
    keywords: clampList(parsed.keywords, 60),
    responsibilities: clampList(parsed.responsibilities, 30),
    experienceRequired: parsed.experienceRequired ?? null,
    educationRequired: parsed.educationRequired ?? null,
    matchScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    matchingSkills: clampList(parsed.matchingSkills, 60),
    missingSkills: clampList(parsed.missingSkills, 60),
    experienceMatch: parsed.experienceMatch ?? null,
    recommendations: clampList(parsed.recommendations, 10),
    summary: parsed.summary ?? null,
  };
}

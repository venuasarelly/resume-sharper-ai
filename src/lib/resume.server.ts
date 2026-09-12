/**
 * Server-only helpers for resume processing: text extraction from PDF/DOCX and
 * structured extraction through Lovable AI. Never imported by client code.
 */

export interface ParsedResume {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  skills: string[];
  experience: { company: string; role: string; period: string; highlights: string[] }[];
  education: { school: string; degree: string; period: string }[];
  certifications: { name: string; issuer: string | null; year: string | null }[];
}

export async function extractText(bytes: Uint8Array, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  const text = lower.endsWith(".pdf") ? await extractPdfText(bytes) : await extractDocxText(bytes);
  const cleaned = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  if (cleaned.length < 50) {
    throw new Error(
      "We could not read any text from this document. If it is a scanned image, please upload a text-based PDF or DOCX.",
    );
  }
  return cleaned.slice(0, 60_000);
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await pdfExtract(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const { unzipSync, strFromU8 } = await import("fflate");
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("This DOCX file could not be opened. Please re-save it and try again.");
  }
  const doc = files["word/document.xml"];
  if (!doc) throw new Error("This DOCX file does not contain readable document text.");
  const xml = strFromU8(doc);
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const RESUME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "fullName",
    "email",
    "phone",
    "location",
    "headline",
    "summary",
    "linkedinUrl",
    "githubUrl",
    "portfolioUrl",
    "skills",
    "experience",
    "education",
    "certifications",
  ],
  properties: {
    fullName: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    headline: { type: ["string", "null"] },
    summary: { type: ["string", "null"] },
    linkedinUrl: { type: ["string", "null"] },
    githubUrl: { type: ["string", "null"] },
    portfolioUrl: { type: ["string", "null"] },
    skills: { type: "array", items: { type: "string" } },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "role", "period", "highlights"],
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          period: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["school", "degree", "period"],
        properties: {
          school: { type: "string" },
          degree: { type: "string" },
          period: { type: "string" },
        },
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "issuer", "year"],
        properties: {
          name: { type: "string" },
          issuer: { type: ["string", "null"] },
          year: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

export async function analyzeResumeText(text: string): Promise<ParsedResume> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app yet.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract structured data from resumes and return strict JSON matching the provided schema. Use ONLY information present in the text. Use null for anything missing, and empty arrays when a section is absent. Never invent employers, dates, skills, certifications, or links. For linkedinUrl, githubUrl and portfolioUrl, return the full URL exactly as written in the resume (add the https:// prefix only if the domain is clearly written); portfolioUrl is any personal website or portfolio link that is not LinkedIn or GitHub.",
        },
        { role: "user", content: `Resume text:\n\n${text}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "resume_profile", strict: true, schema: RESUME_SCHEMA },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`AI gateway error [${response.status}]: ${body}`);
    if (response.status === 429) throw new Error("AI is busy right now. Please try again shortly.");
    if (response.status === 402)
      throw new Error("AI credits are exhausted. Add credits to continue parsing resumes.");
    throw new Error(`Resume analysis failed (status ${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resume analysis returned an empty result.");

  let parsed: Partial<ParsedResume>;
  try {
    parsed = JSON.parse(content) as Partial<ParsedResume>;
  } catch {
    throw new Error("Resume analysis returned an unreadable result.");
  }

  return {
    fullName: parsed.fullName ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    location: parsed.location ?? null,
    headline: parsed.headline ?? null,
    summary: parsed.summary ?? null,
    linkedinUrl: parsed.linkedinUrl ?? null,
    githubUrl: parsed.githubUrl ?? null,
    portfolioUrl: parsed.portfolioUrl ?? null,
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 60) : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience.slice(0, 20) : [],
    education: Array.isArray(parsed.education) ? parsed.education.slice(0, 10) : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 20) : [],
  };
}

/**
 * Field mapping engine: matches detected Workday form fields to values from a
 * resume profile.
 *
 * Rules:
 *  - Deterministic matching runs first and handles every known canonical key.
 *  - AI is only consulted for fields deterministic rules could not resolve.
 *  - Nothing is ever invented: the AI may only select from resume values that
 *    were supplied to it, or return null. Missing data stays missing and is
 *    flagged for review.
 */

export interface ResumeSnapshot {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
  links?: Record<string, string | null | undefined>;
  skills?: string[];
  experience?: { company: string; role: string; period: string; highlights?: string[] }[];
  education?: { school: string; degree: string; period: string }[];
}

export interface DetectedField {
  key?: string | null;
  label: string;
  confidence?: number;
  section?: string | null;
}

export interface MappedField {
  field: string;
  label: string;
  resumeValue: string | null;
  confidence: number;
  reason: string;
  requiresReview: boolean;
  source: "deterministic" | "ai" | "unmapped";
}

const REVIEW_THRESHOLD = 80;

const clean = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
};

function splitName(resume: ResumeSnapshot): { first: string | null; last: string | null } {
  const first = clean(resume.firstName);
  const last = clean(resume.lastName);
  if (first || last) return { first, last };
  const full = clean(resume.fullName);
  if (!full) return { first: null, last: null };
  const parts = full.split(/\s+/);
  if (parts.length === 1) return { first: parts[0]!, last: null };
  return { first: parts[0]!, last: parts[parts.length - 1]! };
}

function findLink(resume: ResumeSnapshot, host: string): string | null {
  const links = resume.links ?? {};
  for (const [name, value] of Object.entries(links)) {
    const v = clean(value);
    if (!v) continue;
    if (name.toLowerCase().includes(host) || v.toLowerCase().includes(`${host}.com`)) return v;
  }
  return null;
}

/** Canonical key -> value taken straight from the resume. No inference. */
function deterministicValue(key: string, resume: ResumeSnapshot): string | null {
  const name = splitName(resume);
  const current = resume.experience?.[0];
  switch (key) {
    case "personal.firstName":
      return name.first;
    case "personal.lastName":
      return name.last;
    case "personal.fullName":
      return clean(resume.fullName);
    case "personal.email":
      return clean(resume.email);
    case "personal.phone":
      return clean(resume.phone);
    case "personal.location":
      return clean(resume.location);
    case "links.linkedin":
      return findLink(resume, "linkedin");
    case "links.github":
      return findLink(resume, "github");
    case "links.portfolio":
    case "links.website":
      return clean(resume.links?.["portfolio"] ?? resume.links?.["website"]);
    case "experience.currentCompany":
      return clean(current?.company);
    case "experience.currentTitle":
      return clean(current?.role);
    case "education.school":
      return clean(resume.education?.[0]?.school);
    case "education.degree":
      return clean(resume.education?.[0]?.degree);
    default:
      return null;
  }
}

const DETERMINISTIC_KEYS = new Set([
  "personal.firstName",
  "personal.lastName",
  "personal.fullName",
  "personal.email",
  "personal.phone",
  "personal.location",
  "links.linkedin",
  "links.github",
  "links.portfolio",
  "links.website",
  "experience.currentCompany",
  "experience.currentTitle",
  "education.school",
  "education.degree",
]);

/** Flat list of resume values the AI is allowed to choose from. */
function allowedValues(resume: ResumeSnapshot): { path: string; value: string }[] {
  const name = splitName(resume);
  const entries: [string, string | null][] = [
    ["personal.firstName", name.first],
    ["personal.lastName", name.last],
    ["personal.fullName", clean(resume.fullName)],
    ["personal.email", clean(resume.email)],
    ["personal.phone", clean(resume.phone)],
    ["personal.location", clean(resume.location)],
    ["profile.headline", clean(resume.headline)],
    ["profile.summary", clean(resume.summary)],
    ["links.linkedin", findLink(resume, "linkedin")],
    ["links.github", findLink(resume, "github")],
  ];
  for (const [k, v] of Object.entries(resume.links ?? {})) {
    const cv = clean(v);
    if (cv) entries.push([`links.${k}`, cv]);
  }
  (resume.experience ?? []).slice(0, 4).forEach((e, i) => {
    entries.push([`experience.${i}.company`, clean(e.company)]);
    entries.push([`experience.${i}.role`, clean(e.role)]);
    entries.push([`experience.${i}.period`, clean(e.period)]);
  });
  (resume.education ?? []).slice(0, 3).forEach((e, i) => {
    entries.push([`education.${i}.school`, clean(e.school)]);
    entries.push([`education.${i}.degree`, clean(e.degree)]);
    entries.push([`education.${i}.period`, clean(e.period)]);
  });
  if (resume.skills?.length) entries.push(["skills", resume.skills.join(", ")]);

  return entries
    .filter((e): e is [string, string] => e[1] !== null)
    .map(([path, value]) => ({ path, value }));
}

const AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["mappings"],
  properties: {
    mappings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "resumePath", "confidence", "reason"],
        properties: {
          label: { type: "string" },
          // Must be one of the supplied paths, or empty when nothing fits.
          resumePath: { type: "string" },
          confidence: { type: "integer" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

async function resolveAmbiguous(
  ambiguous: DetectedField[],
  resume: ResumeSnapshot,
): Promise<MappedField[]> {
  const options = allowedValues(resume);

  const fallback = (f: DetectedField, reason: string): MappedField => ({
    field: clean(f.key) ?? "unmapped",
    label: f.label,
    resumeValue: null,
    confidence: 0,
    reason,
    requiresReview: true,
    source: "unmapped",
  });

  if (options.length === 0) {
    return ambiguous.map((f) => fallback(f, "No resume data available for this field."));
  }

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return ambiguous.map((f) =>
      fallback(f, "No deterministic rule matched and AI assistance is unavailable."),
    );
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: [
        {
          role: "system",
          content:
            "You map job application form fields to values from a candidate's resume. " +
            "You may ONLY select a resumePath from the supplied list of available resume values. " +
            "Never invent, guess, paraphrase, reformat or complete missing information. " +
            'If no supplied value clearly answers the field, return an empty string for resumePath. ' +
            "confidence is an integer 0-100 reflecting how certain the mapping is. " +
            "reason is one short sentence explaining the choice. " +
            "Return one entry per requested field, keeping the label exactly as given. Keep the response minimal.",
        },
        {
          role: "user",
          content:
            `Form fields needing a mapping:\n${ambiguous
              .map((f) => `- ${f.label}${f.key ? ` (detected key: ${f.key})` : ""}`)
              .join("\n")}\n\nAvailable resume values:\n${options
              .map((o) => `- ${o.path}: ${o.value}`)
              .join("\n")}`,
        },
      ],
      text: {
        format: { type: "json_schema", name: "field_mappings", strict: true, schema: AI_SCHEMA },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`AI gateway error [${response.status}]: ${body}`);
    const reason =
      response.status === 429
        ? "AI is busy; map this field manually."
        : response.status === 402
          ? "AI credits are exhausted; map this field manually."
          : "AI mapping failed; map this field manually.";
    return ambiguous.map((f) => fallback(f, reason));
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: { content?: { text?: string }[] }[];
  };
  const content = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text;

  let parsed: { mappings?: { label: string; resumePath: string; confidence: number; reason: string }[] };
  try {
    parsed = content ? JSON.parse(content) : {};
  } catch {
    return ambiguous.map((f) => fallback(f, "AI returned an unreadable result."));
  }

  const byPath = new Map(options.map((o) => [o.path, o.value]));
  const byLabel = new Map((parsed.mappings ?? []).map((m) => [m.label, m]));

  return ambiguous.map((f) => {
    const m = byLabel.get(f.label);
    // A path outside the supplied list would be invented data — reject it.
    const value = m && m.resumePath ? (byPath.get(m.resumePath) ?? null) : null;
    if (!m || value === null) {
      return fallback(f, m?.reason?.trim() || "No resume value matches this field.");
    }
    const confidence = Math.max(0, Math.min(100, Math.round(Number(m.confidence) || 0)));
    return {
      field: clean(f.key) ?? m.resumePath,
      label: f.label,
      resumeValue: value,
      confidence,
      reason: m.reason?.trim() || `AI matched this field to ${m.resumePath}.`,
      requiresReview: confidence < REVIEW_THRESHOLD,
      source: "ai" as const,
    };
  });
}

export async function mapFields(input: {
  resume: ResumeSnapshot;
  fields: DetectedField[];
}): Promise<{ mappings: MappedField[]; deterministicCount: number; aiCount: number }> {
  const deterministic: MappedField[] = [];
  const ambiguous: DetectedField[] = [];

  for (const field of input.fields) {
    const key = clean(field.key);
    if (key && DETERMINISTIC_KEYS.has(key)) {
      const value = deterministicValue(key, input.resume);
      if (value !== null) {
        // Detection confidence caps mapping confidence: a shaky field match
        // shouldn't produce a confident mapping.
        const detection = Math.max(0, Math.min(100, Math.round(field.confidence ?? 100)));
        const confidence = Math.min(99, detection);
        deterministic.push({
          field: key,
          label: field.label,
          resumeValue: value,
          confidence,
          reason: `Exact rule match: ${key} taken directly from the resume.`,
          requiresReview: confidence < REVIEW_THRESHOLD,
          source: "deterministic",
        });
        continue;
      }
      deterministic.push({
        field: key,
        label: field.label,
        resumeValue: null,
        confidence: 0,
        reason: "The resume has no value for this field. Left blank for you to fill in.",
        requiresReview: true,
        source: "unmapped",
      });
      continue;
    }
    ambiguous.push(field);
  }

  const aiResolved = ambiguous.length > 0 ? await resolveAmbiguous(ambiguous, input.resume) : [];

  return {
    mappings: [...deterministic, ...aiResolved],
    deterministicCount: deterministic.filter((m) => m.source === "deterministic").length,
    aiCount: aiResolved.filter((m) => m.source === "ai").length,
  };
}

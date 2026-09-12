import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Demo mode: the app requires no sign-in. Server functions write through the
 * trusted service-role client and every uploaded profile is shared.
 */
const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const UploadInput = z.object({
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().positive().max(MAX_RESUME_BYTES),
  contentType: z.string().max(200).optional(),
  /** base64 encoded file contents (no data: prefix) */
  fileBase64: z.string().min(1),
});

export interface ResumeProfileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  errorMessage: string | null;
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
  createdAt: string;
  updatedAt: string;
}

function toRecord(row: Record<string, unknown>): ResumeProfileRecord {
  return {
    id: String(row['id']),
    fileName: String(row['file_name']),
    fileSize: Number(row['file_size']),
    status: String(row['status']),
    errorMessage: (row['error_message'] as string | null) ?? null,
    fullName: (row['full_name'] as string | null) ?? null,
    email: (row['email'] as string | null) ?? null,
    phone: (row['phone'] as string | null) ?? null,
    location: (row['location'] as string | null) ?? null,
    headline: (row['headline'] as string | null) ?? null,
    summary: (row['summary'] as string | null) ?? null,
    linkedinUrl: (row['linkedin_url'] as string | null) ?? null,
    githubUrl: (row['github_url'] as string | null) ?? null,
    portfolioUrl: (row['portfolio_url'] as string | null) ?? null,
    skills: (row['skills'] as string[] | null) ?? [],
    experience: (row['experience'] as ResumeProfileRecord["experience"] | null) ?? [],
    education: (row['education'] as ResumeProfileRecord["education"] | null) ?? [],
    certifications: (row['certifications'] as ResumeProfileRecord["certifications"] | null) ?? [],
    createdAt: String(row['created_at']),
    updatedAt: String(row['updated_at']),
  };
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function validateFileName(fileName: string): "pdf" | "docx" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}

/** Most recently uploaded resume profile (shared across everyone). */
export const getMyResumeProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("resume_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as Record<string, unknown>) : null;
});

/** Every uploaded resume profile, newest first. */
export const listResumeProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("resume_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toRecord(row as Record<string, unknown>));
});

/**
 * Uploads the document to storage, extracts its text, runs AI extraction and
 * stores the structured result in resume_profiles.
 */
export const uploadAndParseResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UploadInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = await adminClient();
    const kind = validateFileName(data.fileName);
    const bytes = decodeBase64(data.fileBase64);
    if (bytes.byteLength === 0) throw new Error("The uploaded file is empty.");
    if (bytes.byteLength > MAX_RESUME_BYTES) throw new Error("The file is larger than 5 MB.");

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `shared/${Date.now()}-${safeName}`;
    const contentType =
      kind === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const upload = await supabase.storage
      .from("resumes")
      .upload(storagePath, bytes, { contentType, upsert: false });
    if (upload.error) throw new Error(`Upload failed: ${upload.error.message}`);

    const insert = await supabase
      .from("resume_profiles")
      .insert({
        user_id: SHARED_OWNER_ID,
        file_name: data.fileName,
        file_size: bytes.byteLength,
        storage_path: storagePath,
        status: "uploaded",
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);
    const rowId = String((insert.data as Record<string, unknown>)['id']);

    try {
      const { extractText, analyzeResumeText } = await import("./resume.server");
      const text = await extractText(bytes, data.fileName);
      const parsed = await analyzeResumeText(text);

      const updated = await supabase
        .from("resume_profiles")
        .update({
          status: "parsed",
          error_message: null,
          raw_text: text.slice(0, 20_000),
          full_name: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          location: parsed.location,
          headline: parsed.headline,
          summary: parsed.summary,
          linkedin_url: parsed.linkedinUrl,
          github_url: parsed.githubUrl,
          portfolio_url: parsed.portfolioUrl,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          certifications: parsed.certifications,
        })
        .eq("id", rowId)
        .select("*")
        .single();
      if (updated.error) throw new Error(updated.error.message);
      return toRecord(updated.data as Record<string, unknown>);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Parsing failed.";
      await supabase
        .from("resume_profiles")
        .update({ status: "failed", error_message: message })
        .eq("id", rowId);
      throw new Error(message);
    }
  });

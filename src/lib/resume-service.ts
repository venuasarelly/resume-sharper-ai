/**
 * Client-side validation and formatting helpers for resume uploads.
 *
 * Uploads themselves go through the typed server function in
 * `resume.functions.ts` (storage -> text extraction -> AI -> database), so no
 * API base URL is needed: calls are same-origin.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Returns an error message when the file is not an acceptable resume, else null. */
export function validateResumeFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const extensionOk = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const mimeOk = file.type === "" || ALLOWED_MIME_TYPES.includes(file.type);
  if (!extensionOk || !mimeOk) {
    return "Unsupported file type. Please upload a PDF or DOCX file.";
  }
  if (file.size === 0) return "This file appears to be empty.";
  if (file.size > MAX_RESUME_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_RESUME_BYTES)}.`;
  }
  return null;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  getMyResumeProfile,
  listResumeProfiles,
  uploadAndParseResume,
} from "@/lib/resume.functions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  parseTick,
  parsingStarted,
  selectProfile,
  setAllProfiles,
  setStepIndex,
  uploadFailed,
  uploadStarted,
  uploadSucceeded,
} from "@/store/resumeSlice";
import { MAX_RESUME_BYTES, formatFileSize, validateResumeFile } from "@/lib/resume-service";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Upload Your Resume — ApplyAI" },
      {
        name: "description",
        content:
          "Upload your resume as a PDF or DOCX and let AI build your structured job application profile.",
      },
      { property: "og:title", content: "Upload Your Resume — ApplyAI" },
      {
        property: "og:description",
        content: "Upload a PDF or DOCX resume and let AI build your job application profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumePage,
});

const steps = [
  "Uploading Resume",
  "Extracting Text",
  "Analyzing Experience",
  "Identifying Skills",
  "Building Profile",
];

function ResumePage() {
  const upload = useServerFn(uploadAndParseResume);
  const fetchProfile = useServerFn(getMyResumeProfile);
  const fetchAll = useServerFn(listResumeProfiles);

  const dispatch = useAppDispatch();
  const { stage, progress, stepIndex, pendingName, error, profile, allProfiles } = useAppSelector(
    (s) => s.resume,
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshAll = useRef<() => void>(() => undefined);
  refreshAll.current = () => {
    void fetchAll()
      .then((list) => dispatch(setAllProfiles(list)))
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshAll.current();
    void fetchProfile()
      .then((existing) => {
        if (existing) dispatch(selectProfile(existing));
      })
      .catch(() => undefined);
  }, [fetchProfile, dispatch]);

  async function handleFile(file: File) {
    const validationError = validateResumeFile(file);
    if (validationError) {
      dispatch(uploadFailed(validationError));
      toast.error("Upload rejected", { description: validationError });
      return;
    }

    dispatch(uploadStarted(file.name));

    try {
      const fileBase64 = await toBase64(file);
      dispatch(parsingStarted());

      const ticker = window.setInterval(() => {
        dispatch(parseTick(steps.length - 1));
      }, 2200);

      try {
        const result = await upload({
          data: {
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            fileBase64,
          },
        });
        dispatch(uploadSucceeded(result));
        dispatch(setStepIndex(steps.length));
        refreshAll.current();
        toast.success("Resume parsed", { description: "Your profile has been built." });
      } finally {
        window.clearInterval(ticker);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      dispatch(uploadFailed(message));
      toast.error("Upload failed", { description: message });
    }
  }

  function openPicker() {
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  const busy = stage === "uploading" || stage === "parsing";

  return (
    <AppLayout
      title="Upload Your Resume"
      subtitle="Upload your resume and let AI build your job application profile."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-soft lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Resume file</CardTitle>
            <CardDescription>
              PDF and DOCX supported · up to {formatFileSize(MAX_RESUME_BYTES)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && !busy) void handleFile(file);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-muted"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary">
                <Upload className="size-5 text-primary-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">Drag and drop your resume here</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX, single file</p>
              <Button className="mt-4" variant="secondary" onClick={openPicker} disabled={busy}>
                Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>

            {busy && (
              <div className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pendingName}</p>
                    <p className="text-xs text-muted-foreground">
                      {stage === "uploading" ? "Uploading…" : steps[stepIndex]}
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="mt-3 h-1.5" />
              </div>
            )}

            {stage === "error" && error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 size-4 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">We couldn't process that</p>
                  <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                </div>
                <Button size="sm" variant="outline" onClick={openPicker}>
                  Try again
                </Button>
              </div>
            )}

            {stage === "success" && profile && (
              <div className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{profile.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(profile.fileSize)} · Uploaded{" "}
                      {new Date(profile.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="success">Parsed</Badge>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={openPicker} disabled={busy}>
                    <RefreshCw className="size-4" /> Replace Resume
                  </Button>
                  <Button asChild>
                    <Link to="/job-analysis">
                      <Sparkles className="size-4" /> Analyze with AI
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Processing status</CardTitle>
            <CardDescription>Steps completed by the resume service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, i) => {
              const done = i < stepIndex;
              const active = busy && i === stepIndex;
              return (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-border" />
                  )}
                  <span className={done || active ? "" : "text-muted-foreground"}>{step}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {stage === "success" && profile && (
          <Card className="shadow-soft lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base">Parsed profile</CardTitle>
              <CardDescription>Extracted from your document by AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name" value={profile.fullName} />
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone} />
                <Field label="Location" value={profile.location} />
              </div>
              {profile.headline && <Field label="Headline" value={profile.headline} />}
              {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <LinkField label="LinkedIn" value={profile.linkedinUrl} />
                  <LinkField label="GitHub" value={profile.githubUrl} />
                  <LinkField label="Portfolio" value={profile.portfolioUrl} />
                </div>
              )}
              {profile.summary && (
                <div>
                  <p className="text-xs text-muted-foreground">Summary</p>
                  <p className="mt-1">{profile.summary}</p>
                </div>
              )}
              {profile.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="soft">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {profile.experience.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Experience</p>
                    {profile.experience.map((exp, i) => (
                      <div key={`${exp.company}-${i}`} className="rounded-xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">
                            {exp.role} · {exp.company}
                          </p>
                          <span className="text-xs text-muted-foreground">{exp.period}</span>
                        </div>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          {exp.highlights.map((h, j) => (
                            <li key={j}>• {h}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {profile.education.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Education</p>
                  {profile.education.map((edu, i) => (
                    <div
                      key={`${edu.school}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-4"
                    >
                      <span>
                        {edu.degree} · {edu.school}
                      </span>
                      <span className="text-xs text-muted-foreground">{edu.period}</span>
                    </div>
                  ))}
                </div>
              )}
              {profile.certifications.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Certifications</p>
                    {profile.certifications.map((cert, i) => (
                      <div
                        key={`${cert.name}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-4"
                      >
                        <span>{cert.issuer ? `${cert.name} · ${cert.issuer}` : cert.name}</span>
                        {cert.year && (
                          <span className="text-xs text-muted-foreground">{cert.year}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">All uploaded resumes</CardTitle>
            <CardDescription>
              Every resume uploaded to this demo · {allProfiles.length} total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {allProfiles.length === 0 && (
              <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
            )}
            {allProfiles.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  dispatch(selectProfile(item));
                  dispatch(setStepIndex(steps.length));
                }}
                className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors ${
                  profile?.id === item.id
                    ? "border-primary bg-primary-soft"
                    : "border-border/70 hover:bg-surface-muted"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.fullName ?? item.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.email ?? item.fileName} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={item.status === "parsed" ? "success" : "soft"}>{item.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function LinkField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block break-all text-primary underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1">—</p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1">{value ?? "—"}</p>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { resumeProfile } from "@/lib/mock-data";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Resume & AI Parsing — ApplyAI" },
      {
        name: "description",
        content:
          "Upload a resume, let ApplyAI parse it and keep a structured profile ready for Workday autofill.",
      },
      { property: "og:title", content: "Resume & AI Parsing — ApplyAI" },
      {
        property: "og:description",
        content: "Upload and parse your resume into a structured profile for job applications.",
      },
    ],
  }),
  component: ResumePage,
});

type ParseStage = "idle" | "uploading" | "parsing" | "done";

const parseSteps = [
  "Reading document structure",
  "Extracting contact details",
  "Detecting work experience",
  "Ranking skills and keywords",
];

function ResumePage() {
  const [stage, setStage] = useState<ParseStage>("done");
  const [progress, setProgress] = useState(100);
  const [fileName, setFileName] = useState(resumeProfile.fileName);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Simulated pipeline. Replace with a real upload + parsing API call later.
  function startParsing(name: string) {
    setFileName(name);
    setStage("uploading");
    setProgress(12);
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => {
        setStage("parsing");
        setProgress(45);
      }, 700),
      setTimeout(() => setProgress(78), 1500),
      setTimeout(() => {
        setStage("done");
        setProgress(100);
        toast.success("Resume parsed", { description: `${name} is ready for autofill.` });
      }, 2400),
    ];
  }

  const busy = stage === "uploading" || stage === "parsing";

  return (
    <AppLayout title="Resume" subtitle="Upload, parse and manage your resume profile">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Upload resume</CardTitle>
              <CardDescription>PDF or DOCX, up to 5 MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  if (file) startParsing(file.name);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-muted"
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary">
                  <Upload className="size-5 text-primary-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Drag and drop your resume</p>
                <p className="mt-1 text-xs text-muted-foreground">or choose a file to upload</p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  Browse files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) startParsing(file.name);
                  }}
                />
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {resumeProfile.updatedAt}
                    </p>
                  </div>
                  {busy ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="size-4 text-success" />
                  )}
                </div>
                <Progress value={progress} className="mt-3 h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" /> AI parsing
              </CardTitle>
              <CardDescription>What ApplyAI extracts from your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {parseSteps.map((step, i) => {
                const complete = stage === "done" || progress > (i + 1) * 22;
                return (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    {complete ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                    <span className={complete ? "" : "text-muted-foreground"}>{step}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Resume profile</CardTitle>
            <CardDescription>
              Structured data used to autofill Workday application forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue={resumeProfile.fullName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" defaultValue={resumeProfile.headline} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={resumeProfile.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue={resumeProfile.phone} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue={resumeProfile.location} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="summary">Professional summary</Label>
                <Textarea id="summary" rows={3} defaultValue={resumeProfile.summary} />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resumeProfile.skills.map((skill) => (
                  <Badge key={skill} variant="soft">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium">Experience</p>
              {resumeProfile.experience.map((exp) => (
                <div key={exp.company} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {exp.role} · {exp.company}
                    </p>
                    <span className="text-xs text-muted-foreground">{exp.period}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {exp.highlights.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Education</p>
              {resumeProfile.education.map((edu) => (
                <div
                  key={edu.school}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-4 text-sm"
                >
                  <span>
                    {edu.degree} · {edu.school}
                  </span>
                  <span className="text-xs text-muted-foreground">{edu.period}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Discard</Button>
              <Button onClick={() => toast.success("Resume profile saved")}>Save profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

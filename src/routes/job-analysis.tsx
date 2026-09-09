import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Link2, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { MatchScore } from "@/components/MatchScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { analyzedJobs, type AnalyzedJob } from "@/lib/mock-data";

export const Route = createFileRoute("/job-analysis")({
  head: () => ({
    meta: [
      { title: "Job Analysis — ApplyAI" },
      {
        name: "description",
        content:
          "Paste a Workday job link and see match score, matched skills and gaps against your resume.",
      },
      { property: "og:title", content: "Job Analysis — ApplyAI" },
      {
        property: "og:description",
        content: "Score any job posting against your resume before you apply.",
      },
    ],
  }),
  component: JobAnalysisPage,
});

function JobAnalysisPage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<AnalyzedJob>(analyzedJobs[0]!);

  // Replace with a real job-analysis API call later.
  function analyze() {
    if (!url.trim()) {
      toast.error("Paste a job posting URL first");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setSelected(analyzedJobs[0]!);
      toast.success("Job analyzed", { description: "Match score calculated from your resume." });
    }, 1600);
  }

  return (
    <AppLayout title="Job Analysis" subtitle="Score a posting against your resume before applying">
      <div className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Analyze a job posting</CardTitle>
            <CardDescription>Paste a Workday job link, or the full description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://company.wd1.myworkdayjobs.com/careers/job/..."
                  className="pl-9"
                />
              </div>
              <Button onClick={analyze} disabled={analyzing} className="sm:w-40">
                {analyzing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Analyzing
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Analyze job
                  </>
                )}
              </Button>
            </div>
            <Textarea rows={4} placeholder="Or paste the job description here…" />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Analyzed jobs</CardTitle>
              <CardDescription>{analyzedJobs.length} saved analyses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {analyzedJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelected(job)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    selected.id === job.id
                      ? "border-primary bg-primary-soft"
                      : "border-border/70 hover:bg-surface-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{job.role}</p>
                    <span className="text-xs font-semibold text-primary">{job.matchScore}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.company} · {job.analyzedAt}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{selected.role}</CardTitle>
                <CardDescription>{selected.company}</CardDescription>
              </div>
              <MatchScore score={selected.matchScore} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall match</span>
                  <span className="font-semibold">{selected.matchScore}%</span>
                </div>
                <Progress value={selected.matchScore} className="mt-2 h-2" />
              </div>

              <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
                {selected.summary}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Matched skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.matchedSkills.map((s) => (
                      <Badge key={s} variant="success">
                        <Check className="size-3" /> {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Gaps to address</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.missingSkills.map((s) => (
                      <Badge key={s} variant="warning">
                        <X className="size-3" /> {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline">Save analysis</Button>
                <Button onClick={() => toast.success("Autofill draft created")}>
                  Start application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

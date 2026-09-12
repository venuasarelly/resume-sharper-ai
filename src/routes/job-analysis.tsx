import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import MatchScore from "@/components/MatchScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { analyzeJob, listJobAnalyses, type JobAnalysisRecord } from "@/lib/job.functions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  analysisAdded,
  analysisFinished,
  analysisStarted,
  selectAnalysis,
  setAnalyses,
} from "@/store/jobsSlice";

export const Route = createFileRoute("/job-analysis")({
  head: () => ({
    meta: [
      { title: "Job Analysis — ApplyAI" },
      {
        name: "description",
        content:
          "Paste a job description and see your match score, matched skills and gaps against your resume.",
      },
      { property: "og:title", content: "Job Analysis — ApplyAI" },
      {
        property: "og:description",
        content: "Score any job posting against your resume before you apply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobAnalysisPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function JobAnalysisPage() {
  const queryClient = useQueryClient();
  const runAnalyze = useServerFn(analyzeJob);
  const fetchList = useServerFn(listJobAnalyses);

  const dispatch = useAppDispatch();
  const { analyses, selectedId, analyzing } = useAppSelector((s) => s.jobs);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  const listQuery = useQuery({
    queryKey: ["job-analyses"],
    queryFn: () => fetchList(),
  });

  const selected: JobAnalysisRecord | null =
    analyses.find((a) => a.id === selectedId) ?? analyses[0] ?? null;

  useEffect(() => {
    if (listQuery.data) dispatch(setAnalyses(listQuery.data));
  }, [listQuery.data, dispatch]);

  const mutation = useMutation({
    mutationFn: () => {
      dispatch(analysisStarted());
      return runAnalyze({ data: { jobTitle, company, jobDescription: description } });
    },
    onSuccess: async (result) => {
      dispatch(analysisAdded(result.analysis));
      await queryClient.invalidateQueries({ queryKey: ["job-analyses"] });
      toast.success("Job analyzed", {
        description: result.hasResume
          ? `Match score ${result.analysis.matchScore}% against your resume.`
          : "Upload a resume to get a real match score.",
      });
    },
    onError: (error) => {
      dispatch(analysisFinished());
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  function submit() {
    if (!jobTitle.trim() || !company.trim()) {
      toast.error("Add the job title and company");
      return;
    }
    if (description.trim().length < 30) {
      toast.error("Paste the full job description");
      return;
    }
    mutation.mutate();
  }

  return (
    <AppLayout title="Job Analysis" subtitle="Score a posting against your resume before applying">
      <div className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Analyze a job posting</CardTitle>
            <CardDescription>Add the role details and paste the full description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title, e.g. Senior Product Designer"
              />
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
              />
            </div>
            <Textarea
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the job description here…"
            />
            <div className="flex justify-end">
              <Button
                onClick={submit}
                disabled={mutation.isPending || analyzing}
                className="sm:w-44"
              >
                {mutation.isPending || analyzing ? (
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
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Analyzed jobs</CardTitle>
              <CardDescription>
                {analyses.length} saved {analyses.length === 1 ? "analysis" : "analyses"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {analyses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Analyze your first job posting to see it here.
                </p>
              )}
              {analyses.map((job) => (
                <button
                  key={job.id}
                  onClick={() => dispatch(selectAnalysis(job.id))}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    selected?.id === job.id
                      ? "border-primary bg-primary-soft"
                      : "border-border/70 hover:bg-surface-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{job.jobTitle}</p>
                    <span className="text-xs font-semibold text-primary">{job.matchScore}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.company} · {formatDate(job.createdAt)}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft lg:col-span-2">
            {selected ? (
              <>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{selected.jobTitle}</CardTitle>
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

                  {selected.summary && (
                    <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
                      {selected.summary}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Matched skills</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.matchingSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">None found yet</p>
                        )}
                        {selected.matchingSkills.map((s) => (
                          <Badge key={s} variant="success">
                            <Check className="size-3" /> {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gaps to address</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.missingSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No gaps found</p>
                        )}
                        {selected.missingSkills.map((s) => (
                          <Badge key={s} variant="warning">
                            <X className="size-3" /> {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoBlock label="Experience required" value={selected.experienceRequired} />
                    <InfoBlock label="Experience match" value={selected.experienceMatch} />
                    <InfoBlock label="Education required" value={selected.educationRequired} />
                    <InfoBlock
                      label="Preferred skills"
                      value={selected.preferredSkills.join(", ") || null}
                    />
                  </div>

                  {selected.responsibilities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Key responsibilities</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {selected.responsibilities.slice(0, 8).map((r, i) => (
                          <li key={`${r}-${i}`}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Recommendations</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {selected.recommendations.map((r, i) => (
                          <li key={`${r}-${i}`}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Keywords to include</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.keywords.slice(0, 24).map((k) => (
                          <Badge key={k} variant="secondary">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                {listQuery.isLoading ? "Loading…" : "Your analysis results will appear here."}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value ?? "—"}</p>
    </div>
  );
}

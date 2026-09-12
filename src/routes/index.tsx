import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Briefcase, FileText, Sparkles, Target, Upload } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import MatchScore from "@/components/MatchScore";
import StatusBadge from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listJobAnalyses } from "@/lib/job.functions";
import { getMyResumeProfile, listResumeProfiles } from "@/lib/resume.functions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectProfile, setAllProfiles } from "@/store/resumeSlice";
import { setAnalyses } from "@/store/jobsSlice";
import { selectResumeCompletion } from "@/store/selectors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ApplyAI job application assistant" },
      {
        name: "description",
        content:
          "See your resume completion, applications, analyzed jobs and average match score in one ApplyAI dashboard.",
      },
      { property: "og:title", content: "Dashboard — ApplyAI job application assistant" },
      {
        property: "og:description",
        content: "Track resume completion, applications and job match scores with ApplyAI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const dispatch = useAppDispatch();
  const fetchProfile = useServerFn(getMyResumeProfile);
  const fetchProfiles = useServerFn(listResumeProfiles);
  const fetchAnalyses = useServerFn(listJobAnalyses);

  const applications = useAppSelector((s) => s.applications.items);
  const analyses = useAppSelector((s) => s.jobs.analyses);
  const completion = useAppSelector(selectResumeCompletion);
  const profile = useAppSelector((s) => s.resume.profile);

  useEffect(() => {
    void fetchProfiles()
      .then((list) => dispatch(setAllProfiles(list)))
      .catch(() => undefined);
    void fetchProfile()
      .then((existing) => {
        if (existing) dispatch(selectProfile(existing));
      })
      .catch(() => undefined);
    void fetchAnalyses()
      .then((list) => dispatch(setAnalyses(list)))
      .catch(() => undefined);
  }, [dispatch, fetchProfile, fetchProfiles, fetchAnalyses]);

  const scores = [
    ...analyses.map((a) => a.matchScore),
    ...applications.map((a) => a.matchScore),
  ].filter((n) => typeof n === "number");
  const averageMatch = scores.length
    ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length)
    : 0;

  const recent = applications.slice(0, 5);

  return (
    <AppLayout
      title="Dashboard"
      subtitle={profile?.fullName ? `Welcome back, ${profile.fullName}` : "Welcome to ApplyAI"}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Resume completion"
            value={`${completion}%`}
            icon={FileText}
            progress={completion}
            hint={profile ? profile.fileName : "No resume uploaded yet"}
          />
          <StatCard
            label="Applications"
            value={String(applications.length)}
            icon={Briefcase}
            hint="Saved in your history"
          />
          <StatCard
            label="Jobs analyzed"
            value={String(analyses.length)}
            icon={Sparkles}
            hint="Postings scored against your resume"
          />
          <StatCard
            label="Average match score"
            value={`${averageMatch}%`}
            icon={Target}
            progress={averageMatch}
            hint="Across analyses and applications"
          />
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Jump straight into the next step</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/resume">
                <Upload className="size-4" />
                Upload Resume
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/job-analysis">
                <Sparkles className="size-4" />
                Analyze Job
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/applications">
                <Briefcase className="size-4" />
                Start Application
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Recent applications</CardTitle>
            <CardDescription>Your five most recent application records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No applications yet — autofill one from the Applications page.
              </p>
            )}
            {recent.map((application) => (
              <div
                key={application.id}
                className="flex items-center gap-4 rounded-xl border border-border/70 px-4 py-3"
              >
                <MatchScore score={application.matchScore} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{application.role}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.company} · Applied {application.appliedAt}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

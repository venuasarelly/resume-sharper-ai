import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Gauge,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { MatchScore } from "@/components/MatchScore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { applications, analyzedJobs, dashboardStats, resumeProfile } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ApplyAI Dashboard — AI Job Application Assistant" },
      {
        name: "description",
        content:
          "Track resume completeness, job match scores and Workday application progress in the ApplyAI dashboard.",
      },
      { property: "og:title", content: "ApplyAI Dashboard — AI Job Application Assistant" },
      {
        property: "og:description",
        content: "Your AI assistant for smarter job applications on Workday career sites.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  {
    title: "Upload Resume",
    description: "Parse a new resume with AI",
    icon: Upload,
    to: "/resume" as const,
  },
  {
    title: "Analyze Job",
    description: "Score a Workday job posting",
    icon: Sparkles,
    to: "/job-analysis" as const,
  },
  {
    title: "Start Application",
    description: "Autofill and review",
    icon: Wand2,
    to: "/applications" as const,
  },
];

function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Your AI Assistant for Smarter Job Applications">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-hero text-primary-foreground shadow-elevated">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-widest opacity-80">ApplyAI</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Welcome back, {resumeProfile.fullName.split(" ")[0]}
              </h2>
              <p className="mt-2 text-sm opacity-90">
                You have 3 analyzed jobs ready to apply to and 1 draft application waiting for
                review.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/job-analysis">
                  Analyze a job <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outlineOnDark">
                <Link to="/applications">Review drafts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Resume completion"
            value={`${dashboardStats.resumeCompletion}%`}
            icon={FileText}
            progress={dashboardStats.resumeCompletion}
            hint="Add certifications to reach 100%"
          />
          <StatCard
            label="Applications"
            value={String(dashboardStats.applications)}
            icon={Briefcase}
            hint="4 submitted this week"
          />
          <StatCard
            label="Jobs analyzed"
            value={String(dashboardStats.jobsAnalyzed)}
            icon={Sparkles}
            hint="12 above an 80% match"
          />
          <StatCard
            label="Average match score"
            value={`${dashboardStats.averageMatchScore}%`}
            icon={Gauge}
            progress={dashboardStats.averageMatchScore}
            hint="Up 6 points from last month"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.to} className="group">
              <Card className="h-full shadow-soft transition-all group-hover:-translate-y-0.5 group-hover:shadow-elevated">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary">
                    <action.icon className="size-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Recent applications</CardTitle>
                <CardDescription>Latest Workday submissions and drafts</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/applications">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {applications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3.5 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                    {app.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.role}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.company} · {app.location} · {app.appliedAt}
                    </p>
                  </div>
                  <MatchScore score={app.matchScore} />
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Top matches</CardTitle>
              <CardDescription>Analyzed jobs worth applying to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {analyzedJobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{job.role}</p>
                    <span className="text-xs font-semibold text-primary">{job.matchScore}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                  <Progress value={job.matchScore} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Search, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { MatchScore } from "@/components/MatchScore";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { applications, autofillFields } from "@/lib/mock-data";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications & Autofill — ApplyAI" },
      {
        name: "description",
        content:
          "Autofill Workday application forms from your parsed resume, review every field and track application history.",
      },
      { property: "og:title", content: "Applications & Autofill — ApplyAI" },
      {
        property: "og:description",
        content: "Autofill, review and track your Workday job applications in one place.",
      },
    ],
  }),
  component: ApplicationsPage,
});

const sections = Array.from(new Set(autofillFields.map((f) => f.section)));

function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(true);

  const visible = applications.filter((a) =>
    `${a.company} ${a.role} ${a.location}`.toLowerCase().includes(query.toLowerCase()),
  );

  // Replace with the real Workday autofill service later.
  function runAutofill() {
    setFilling(true);
    setFilled(false);
    setTimeout(() => {
      setFilling(false);
      setFilled(true);
      toast.success("Form autofilled", { description: "11 fields mapped from your resume." });
    }, 1600);
  }

  return (
    <AppLayout title="Applications" subtitle="Autofill, review and track every application">
      <Tabs defaultValue="autofill" className="space-y-6">
        <TabsList>
          <TabsTrigger value="autofill">Autofill & Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="autofill" className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Stripe — Senior Frontend Engineer</CardTitle>
                <CardDescription>Workday application · 11 detected fields</CardDescription>
              </div>
              <Button onClick={runAutofill} disabled={filling}>
                {filling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Filling
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" /> Autofill form
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Progress value={filling ? 55 : filled ? 100 : 0} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {filling
                  ? "Mapping resume fields to the application form…"
                  : filled
                    ? "All fields mapped. Review the values below before submitting."
                    : "Ready to autofill."}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">{section}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {autofillFields
                    .filter((f) => f.section === section)
                    .map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-muted-foreground" htmlFor={field.id}>
                            {field.label}
                          </label>
                          <span className="text-xs font-medium text-primary">
                            {field.confidence}% confident
                          </span>
                        </div>
                        <Input id={field.id} defaultValue={filled ? field.value : ""} />
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-soft">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" />
                Reviewed values are stored with the application record.
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Save as draft</Button>
                <Button onClick={() => toast.success("Application submitted")}>
                  Submit application
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company or role"
              className="pl-9"
            />
          </div>

          <Card className="shadow-soft">
            <CardContent className="space-y-2 p-4">
              {visible.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                    {app.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.role}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.company} · {app.location} · {app.source} · {app.appliedAt}
                    </p>
                  </div>
                  <MatchScore score={app.matchScore} />
                  <StatusBadge status={app.status} />
                </div>
              ))}
              {visible.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No applications match that search.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import StatusBadge from "../components/StatusBadge";
import MatchScore from "../components/MatchScore";
import { mapFieldsFn } from "../lib/map-fields.functions";
import type { AppDispatch, RootState } from "../store";
import {
  addApplication,
  autofillCompleted,
  autofillStarted,
  setSearch,
  setTarget,
  updateField,
} from "../store/applicationsSlice";
import { selectAutofillFromResume, selectFilteredApplications } from "../store/selectors";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications — ApplyPilot" },
      {
        name: "description",
        content: "Track your job applications and autofill new ones from your resume.",
      },
      { property: "og:title", content: "Applications — ApplyPilot" },
      {
        property: "og:description",
        content: "Track your job applications and autofill new ones from your resume.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicationsPage,
});

type Tab = "history" | "autofill";

function ApplicationsPage() {
  const [tab, setTab] = useState<Tab>("history");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your application history or autofill a new one from your resume.
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1" role="tablist">
        {(
          [
            { id: "history", label: "History" },
            { id: "autofill", label: "Autofill" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "history" ? <HistoryTab /> : <AutofillTab />}
    </main>
  );
}

function HistoryTab() {
  const dispatch = useDispatch<AppDispatch>();
  const search = useSelector((state: RootState) => state.applications.search);
  const items = useSelector(selectFilteredApplications);

  return (
    <section>
      <input
        type="search"
        value={search}
        onChange={(event) => dispatch(setSearch(event.target.value))}
        placeholder="Search by company, role, or status…"
        aria-label="Search applications"
        className="mb-4 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No applications match your search.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((application) => (
            <li
              key={application.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
            >
              <MatchScore score={application.matchScore} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {application.role}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {application.company} · Applied {application.appliedAt}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const progressLabel = (progress: number) => {
  if (progress < 40) return "Reading resume…";
  if (progress < 80) return "Mapping fields…";
  return "Scoring match…";
};

function AutofillTab() {
  const dispatch = useDispatch<AppDispatch>();
  const target = useSelector((state: RootState) => state.applications.target);
  const autofill = useSelector((state: RootState) => state.applications.autofill);
  const lastMatchScore = useSelector((state: RootState) => state.applications.lastMatchScore);
  const resumeFields = useSelector(selectAutofillFromResume);
  const skills = useSelector((state: RootState) => state.resume.profile?.skills ?? []);
  const runMapFields = useServerFn(mapFieldsFn);

  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const running = autofill.status === "running";
  const canRun = target.company.trim().length > 0 && target.role.trim().length > 0 && !running;

  const handleRun = async () => {
    dispatch(autofillStarted());
    setProgress(0);
    timerRef.current = setInterval(
      () => setProgress((p) => Math.min(p + 4 + Math.random() * 10, 92)),
      220,
    );
    try {
      const result = await runMapFields({
        data: {
          target,
          fields: resumeFields.map(({ id, label, value }) => ({ id, label, value })),
          skills,
        },
      });
      setProgress(100);
      dispatch(autofillCompleted(result));
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSave = () => {
    dispatch(
      addApplication({
        id: crypto.randomUUID(),
        company: target.company,
        role: target.role,
        appliedAt: new Date().toISOString().slice(0, 10),
        status: "applied",
        matchScore: lastMatchScore ?? 0,
      }),
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Target job</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Company</span>
            <input
              value={target.company}
              onChange={(event) => dispatch(setTarget({ ...target, company: event.target.value }))}
              placeholder="Acme Corp"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Role</span>
            <input
              value={target.role}
              onChange={(event) => dispatch(setTarget({ ...target, role: event.target.value }))}
              placeholder="Frontend Engineer"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Job posting URL</span>
            <input
              value={target.jobUrl}
              onChange={(event) => dispatch(setTarget({ ...target, jobUrl: event.target.value }))}
              placeholder="https://…"
              type="url"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Autofilling…" : "Run autofill from resume"}
        </button>
      </div>

      {running && (
        <div className="rounded-xl border border-border bg-card p-4" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{progressLabel(progress)}</span>
            <span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {autofill.status === "done" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Autofilled fields</h2>
            {lastMatchScore !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Match score</span>
                <MatchScore score={lastMatchScore} />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {autofill.fields.map((field) => (
              <label key={field.id} className="block text-sm">
                <span className="mb-1 flex items-center gap-2 text-muted-foreground">
                  {field.label}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {field.source}
                  </span>
                </span>
                <input
                  value={field.value}
                  onChange={(event) =>
                    dispatch(updateField({ id: field.id, value: event.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Save to history
          </button>
        </div>
      )}
    </section>
  );
}

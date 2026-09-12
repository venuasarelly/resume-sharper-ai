import { createFileRoute } from "@tanstack/react-router";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  resetSettings,
  setPreference,
  toggleSetting,
  type BooleanSettingKey,
  type SettingsState,
} from "../store/settingsSlice";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ApplyPilot" },
      {
        name: "description",
        content: "Manage autofill behaviour, notifications, and application preferences.",
      },
      { property: "og:title", content: "Settings — ApplyPilot" },
      {
        property: "og:description",
        content: "Manage autofill behaviour, notifications, and application preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const toggles: { key: BooleanSettingKey; title: string; description: string }[] = [
  {
    key: "autoAutofill",
    title: "Auto-autofill new applications",
    description: "Start mapping resume fields as soon as you open a new target job.",
  },
  {
    key: "saveDraftApplications",
    title: "Save drafts",
    description: "Keep unfinished applications in your history as drafts.",
  },
  {
    key: "emailNotifications",
    title: "Email notifications",
    description: "Get emailed when a recruiter views or replies to an application.",
  },
  {
    key: "weeklyDigest",
    title: "Weekly digest",
    description: "Receive a Monday summary of your pipeline and follow-ups.",
  },
  {
    key: "includePortfolio",
    title: "Include portfolio link",
    description: "Attach your portfolio URL to autofilled applications by default.",
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control how ApplyPilot fills, saves, and tracks your applications.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Autofill & notifications
        </h2>
        <ul className="divide-y divide-border">
          {toggles.map(({ key, title, description }) => (
            <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Toggle checked={settings[key]} onChange={() => dispatch(toggleSetting(key))} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Preferences
        </h2>
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Default tone</span>
            <select
              value={settings.defaultTone}
              onChange={(event) =>
                dispatch(
                  setPreference({
                    defaultTone: event.target.value as SettingsState["defaultTone"],
                  }),
                )
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="concise">Concise</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Theme</span>
            <select
              value={settings.theme}
              onChange={(event) =>
                dispatch(setPreference({ theme: event.target.value as SettingsState["theme"] }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Default resume</span>
            <select
              value={settings.defaultResume}
              onChange={(event) => dispatch(setPreference({ defaultResume: event.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="master-resume">Master resume</option>
              <option value="frontend-resume">Frontend resume</option>
              <option value="fullstack-resume">Full-stack resume</option>
            </select>
          </label>
        </div>
      </section>

      <button
        onClick={() => dispatch(resetSettings())}
        className="mt-6 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        Reset to defaults
      </button>
    </main>
  );
}

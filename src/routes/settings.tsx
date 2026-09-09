import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resumeProfile } from "@/lib/mock-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ApplyAI" },
      {
        name: "description",
        content:
          "Manage your ApplyAI account, autofill preferences, job alerts and notification settings.",
      },
      { property: "og:title", content: "Settings — ApplyAI" },
      {
        property: "og:description",
        content: "Account, autofill and notification preferences for ApplyAI.",
      },
    ],
  }),
  component: SettingsPage,
});

const toggles = [
  { id: "auto-submit", label: "Auto-submit high matches", hint: "Submit jobs above 90% match automatically" },
  { id: "cover-letter", label: "Generate cover letters", hint: "Draft a tailored letter per application" },
  { id: "alerts", label: "New job alerts", hint: "Email me when a strong match appears" },
  { id: "weekly", label: "Weekly summary", hint: "A digest of applications and responses" },
];

function SettingsPage() {
  return (
    <AppLayout title="Settings" subtitle="Account, autofill and notification preferences">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Details shown on your applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Full name</Label>
              <Input id="s-name" defaultValue={resumeProfile.fullName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" defaultValue={resumeProfile.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-location">Location</Label>
              <Input id="s-location" defaultValue={resumeProfile.location} />
            </div>
            <Button onClick={() => toast.success("Account updated")}>Save changes</Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Automation</CardTitle>
            <CardDescription>How ApplyAI handles applications for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Minimum match score to apply</Label>
              <Select defaultValue="70">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="70">70%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            {toggles.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.hint}</p>
                </div>
                <Switch id={t.id} defaultChecked={t.id !== "auto-submit"} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Data & privacy</CardTitle>
            <CardDescription>Your resume data stays private to your account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline">Export my data</Button>
            <Button variant="outline">Delete stored resume</Button>
            <Button variant="destructive">Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  progress?: number;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, progress, className }: StatCardProps) {
  return (
    <Card className={cn("shadow-soft transition-shadow hover:shadow-elevated", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
        {typeof progress === "number" && <Progress value={progress} className="mt-4 h-1.5" />}
        {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

import { statusLabels, type ApplicationStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const tones: Record<ApplicationStatus, string> = {
  submitted: "bg-primary-soft text-primary",
  in_review: "bg-warning-soft text-warning",
  interview: "bg-success-soft text-success",
  rejected: "bg-destructive/10 text-destructive",
  draft: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

import type { ApplicationStatus } from "../store/applicationsSlice";

const config: Record<ApplicationStatus, { label: string; className: string }> = {
  applied: { label: "Applied", className: "bg-accent text-accent-foreground" },
  interviewing: { label: "Interviewing", className: "bg-primary text-primary-foreground" },
  offer: { label: "Offer", className: "bg-chart-2 text-primary-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

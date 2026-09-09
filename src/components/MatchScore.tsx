import { cn } from "@/lib/utils";

interface MatchScoreProps {
  score: number;
  className?: string;
}

export function MatchScore({ score, className }: MatchScoreProps) {
  const tone =
    score >= 85
      ? "bg-success-soft text-success"
      : score >= 70
        ? "bg-primary-soft text-primary"
        : "bg-warning-soft text-warning";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      {score}% match
    </span>
  );
}

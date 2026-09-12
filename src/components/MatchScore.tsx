export default function MatchScore({
  score,
  size = 44,
}: {
  score: number;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      role="img"
      aria-label={`Match score ${clamped} out of 100`}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--color-primary) ${clamped * 3.6}deg, var(--color-muted) 0deg)`,
      }}
    >
      <div className="absolute inset-[3px] rounded-full bg-card" />
      <span className="relative text-xs font-semibold text-foreground">{clamped}</span>
    </div>
  );
}

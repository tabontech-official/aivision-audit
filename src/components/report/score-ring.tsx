import { cn } from "@/lib/utils/cn";

/**
 * Circular score gauge. Color follows the score band (matches the default
 * grade colors). Pure SVG, no client JS.
 */
export function ScoreRing({
  score,
  size = 96,
  strokeWidth = 8,
  label,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  const offset = circumference - (value / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-bold tabular-nums text-ink"
          style={{ fontSize: size / 3.4 }}
        >
          {score !== null ? Math.round(score) : "—"}
        </span>
        {label && <span className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</span>}
      </div>
    </div>
  );
}

export function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 90) return "#16a34a";
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function ScorePill({ score }: { score: number | null }) {
  const color = scoreColor(score);
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums",
      )}
      style={{ borderColor: color, color: "#0f172a" }}
    >
      {score !== null ? Math.round(score) : "—"}
    </span>
  );
}

import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "free"
  | "premium"
  | "hidden"
  | "both"
  | "enabled"
  | "disabled"
  | "draft"
  | "published"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "system"
  | "neutral";

const styles: Record<BadgeVariant, string> = {
  free: "bg-success-50 text-success-700 border-success-100",
  premium: "bg-premium-50 text-premium-700 border-premium-100",
  hidden: "bg-slate-100 text-ink-muted border-slate-200",
  both: "bg-brand-50 text-brand-700 border-brand-100",
  enabled: "bg-success-50 text-success-700 border-success-100",
  disabled: "bg-slate-100 text-ink-muted border-slate-200",
  draft: "bg-warning-50 text-warning-700 border-warning-100",
  published: "bg-success-50 text-success-700 border-success-100",
  critical: "bg-danger-50 text-danger-700 border-danger-100",
  high: "bg-danger-50 text-danger-600 border-danger-100",
  medium: "bg-warning-50 text-warning-700 border-warning-100",
  low: "bg-slate-100 text-ink-secondary border-slate-200",
  info: "bg-brand-50 text-brand-700 border-brand-100",
  system: "bg-slate-800 text-white border-slate-800",
  neutral: "bg-slate-100 text-ink-secondary border-slate-200",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function planBadgeVariant(planAccess: string): BadgeVariant {
  switch (planAccess) {
    case "FREE": return "free";
    case "PREMIUM": return "premium";
    case "HIDDEN": return "hidden";
    default: return "both";
  }
}

export function severityBadgeVariant(severity: string): BadgeVariant {
  switch (severity) {
    case "CRITICAL": return "critical";
    case "HIGH": return "high";
    case "MEDIUM": return "medium";
    case "LOW": return "low";
    default: return "info";
  }
}

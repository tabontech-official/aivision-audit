import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  MinusCircle,
  AlertOctagon,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, { Icon: LucideIcon; className: string }> = {
  PASS: { Icon: CheckCircle2, className: "text-success-600" },
  FAIL: { Icon: XCircle, className: "text-danger-600" },
  WARNING: { Icon: AlertTriangle, className: "text-warning-600" },
  INFO: { Icon: Info, className: "text-brand-600" },
  NOT_APPLICABLE: { Icon: MinusCircle, className: "text-ink-muted" },
  ERROR: { Icon: AlertOctagon, className: "text-ink-muted" },
};

export function StatusIcon({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? MAP.INFO!;
  const { Icon, className: colorCls } = entry;
  return <Icon className={`${colorCls} ${className ?? "h-5 w-5"}`} aria-hidden />;
}

export function severityLabel(severity: string): string {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

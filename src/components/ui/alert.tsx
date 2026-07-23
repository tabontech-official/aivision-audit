import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertVariant = "error" | "success" | "warning" | "info";

const styles: Record<AlertVariant, { wrap: string; Icon: typeof Info }> = {
  error: { wrap: "border-danger-100 bg-danger-50 text-danger-700", Icon: AlertCircle },
  success: { wrap: "border-success-100 bg-success-50 text-success-700", Icon: CheckCircle2 },
  warning: { wrap: "border-warning-100 bg-warning-50 text-warning-700", Icon: TriangleAlert },
  info: { wrap: "border-brand-100 bg-brand-50 text-brand-700", Icon: Info },
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

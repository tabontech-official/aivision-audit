import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "premium";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#FF4D00] text-white hover:bg-[#E64500] active:bg-[#CC3D00] disabled:bg-orange-300 font-semibold shadow-sm rounded-xl",
  secondary:
    "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400 font-semibold rounded-xl",
  ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-medium rounded-xl",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 font-semibold rounded-xl",
  premium:
    "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 disabled:bg-purple-300 font-semibold rounded-xl",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs sm:text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

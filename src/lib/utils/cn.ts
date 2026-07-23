/**
 * Minimal className combiner. Later phases may swap in clsx + tailwind-merge
 * if class conflicts arise; the call sites stay identical.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

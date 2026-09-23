export function BrandIcon({ className = "w-8 h-8", alt = "AI Vision Audit Logo" }: { className?: string; alt?: string }) {
  return (
    <img
      src="/images/logo.png"
      alt={alt}
      className={`object-contain shrink-0 bg-transparent mix-blend-multiply ${className}`}
    />
  );
}

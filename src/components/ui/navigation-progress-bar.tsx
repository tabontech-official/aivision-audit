"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, startTransition] = useTransition();

  // Reset when route transition completes
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Intercept click on any internal links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, mailto, tel, downloads, or target="_blank"
      if (
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.getAttribute("target") === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's already the current page with same query
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href === currentFullUrl) return;

      // Trigger instant loading animation
      startTransition(() => {
        setIsNavigating(true);
        setProgress(30);
      });
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  // Incrementally advance progress while waiting
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isNavigating]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress((prev) => (prev > 0 ? 100 : 0));
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setProgress(25);
    };

    const handleStop = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    window.addEventListener("app:loading-start", handleStart);
    window.addEventListener("app:loading-stop", handleStop);

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === window.location.pathname && !href.includes("?")) {
        return;
      }

      handleStart();
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("app:loading-start", handleStart);
      window.removeEventListener("app:loading-stop", handleStop);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

    const t1 = setTimeout(() => setProgress((p) => Math.max(p, 45)), 120);
    const t2 = setTimeout(() => setProgress((p) => Math.max(p, 70)), 350);
    const t3 = setTimeout(() => setProgress((p) => Math.max(p, 88)), 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-9999 h-0.75 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-linear-to-r from-amber-400 via-gold to-amber-600 shadow-[0_0_8px_rgba(201,147,62,0.85)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? "width 150ms ease-out, opacity 250ms ease-out"
              : "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

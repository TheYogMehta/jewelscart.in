"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function VerificationBanner({ enabled = true }: { enabled?: boolean }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem(
        "verification_banner_dismissed",
      );
      if (isDismissed) setDismissed(true);
    }
  }, []);

  if (!mounted || !enabled) return null;

  // If user is logged in with Google do not show banner
  if (session?.user?.provider === "google") return null;

  // Show banner if:
  // 1. Just registered
  // 2. User is logged in via credentials and unverified
  const shouldShow =
    !dismissed &&
    (justRegistered ||
      (session?.user &&
        session.user.provider === "credentials" &&
        !session.user.isEmailVerified));

  if (!shouldShow) return null;

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("verification_banner_dismissed", "1");
    }
  }

  return (
    <div className="relative isolate flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-950 sm:text-sm lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold">
          !
        </span>
        <p>
          <span className="font-semibold">Verify your email:</span> Please check
          your inbox or spam/junk folder to verify your email, or connect with
          Google to bypass email verification.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-800 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-100"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Connect with Google
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1 text-amber-700 hover:bg-amber-200/60 hover:text-amber-900"
          aria-label="Dismiss banner"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

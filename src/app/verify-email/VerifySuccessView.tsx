"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function VerifySuccessView({ email }: { email?: string }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const targetUrl = `/login?verified=1${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  useEffect(() => {
    if (countdown <= 0) {
      router.push(targetUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router, targetUrl]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">
        Email Verified!
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Thank you for confirming your email address. Your JewelsCart account is
        now fully verified.
      </p>

      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1 text-xs font-medium text-stone-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Redirecting to sign in in {countdown}s...
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={targetUrl}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition"
        >
          Proceed to Sign In
        </Link>
        <Link
          href="/"
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

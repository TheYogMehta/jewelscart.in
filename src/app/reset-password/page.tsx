"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Turnstile, type TurnstileRef } from "@/components/Turnstile";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleTurnstileVerify = useCallback((t: string) => {
    setTurnstileToken(t);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/login?reset=1");
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError(
        "Reset token is missing. Please use the link sent to your email.",
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match. Please ensure both fields are identical.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">
            Missing Reset Token
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            This password reset link is invalid or incomplete. Please request a
            new reset link.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition"
            >
              Request New Link
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
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
            Password Reset Complete!
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Your password has been successfully updated. You can now use your
            new password to log in.
          </p>

          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1 text-xs font-medium text-stone-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Redirecting to sign in in {countdown}s...
          </p>

          <div className="mt-6">
            <Link
              href="/login?reset=1"
              className="flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-stone-900">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Please choose a secure password with at least 6 characters.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
              >
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            <p className="mt-1 text-xs text-stone-500">
              Must be at least 6 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <Turnstile
            ref={turnstileRef}
            action="reset_password"
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating password..." : "Update Password"}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel and Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

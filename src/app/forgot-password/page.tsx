"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, useCallback } from "react";
import { Turnstile, type TurnstileRef } from "@/components/Turnstile";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process request. Please try again.");
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-800">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Enter the email associated with your account and we&apos;ll send you
            a secure link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 leading-relaxed">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 leading-relaxed">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium text-emerald-900">
                    Reset link dispatched
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    If an account with <strong>{email}</strong> exists, an email
                    has been sent with instructions to reset your password.
                    Please check your inbox and spam folder.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <Turnstile
              ref={turnstileRef}
              action="forgot_password"
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending reset link..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

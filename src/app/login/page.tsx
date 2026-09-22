"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { sanitizeCallbackUrl } from "@/lib/security";
import { Turnstile, type TurnstileRef } from "@/components/Turnstile";

function LoginContent() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = sanitizeCallbackUrl(
    rawCallback,
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const initialError = searchParams.get("error");
  const isVerified = searchParams.get("verified") === "1";
  const isReset = searchParams.get("reset") === "1";
  const emailParam = searchParams.get("email") ?? "";
  const defaultMode =
    searchParams.get("mode") === "signup" && !isVerified && !isReset
      ? "signup"
      : "signin";

  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
  const [error, setError] = useState<string | null>(
    initialError
      ? "Sign in failed. Please check your credentials and try again."
      : null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    isReset
      ? "Your password has been reset successfully! Please sign in with your new password."
      : isVerified
        ? "Your email has been verified successfully! Please enter your password to sign in."
        : null,
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      router.replace(callbackUrl);
    }
  }, [sessionStatus, session, callbackUrl, router]);

  useEffect(() => {
    if (isVerified || isReset) {
      if (emailParam) {
        setEmail(emailParam);
      }
      setMode("signin");
      const t = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isVerified, isReset, emailParam]);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  function handleSwitchMode(newMode: "signin" | "signup") {
    if (loading || googleLoading) return;
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  }

  const handleGoogleSignIn = () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setError(null);
    setSuccessMessage(null);
    window.dispatchEvent(new CustomEvent("app:loading-start"));
    signIn("google", { callbackUrl }).catch(() => {
      setGoogleLoading(false);
      window.dispatchEvent(new CustomEvent("app:loading-stop"));
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    window.dispatchEvent(new CustomEvent("app:loading-start"));

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            email: email.trim(),
            password,
            turnstileToken: turnstileToken || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed. Please try again.");
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app:loading-stop"));
          return;
        }

        if (data.requiresVerification) {
          setMode("signin");
          setPassword("");
          setSuccessMessage(
            data.message ||
              "Account created! Please check your email to verify your address before signing in with password. (You can also sign in directly with Google anytime).",
          );
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app:loading-stop"));
          return;
        }

        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          setMode("signin");
          setError("Account created! Please sign in with your password.");
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app:loading-stop"));
          return;
        }

        const separator = callbackUrl.includes("?") ? "&" : "?";
        const targetUrl = `${callbackUrl}${separator}registered=1`;
        window.location.href = targetUrl;
      } else {
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!loginRes || loginRes.error) {
          setError("Invalid email or password. Please try again.");
          setLoading(false);
          window.dispatchEvent(new CustomEvent("app:loading-stop"));
          return;
        }

        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
      window.dispatchEvent(new CustomEvent("app:loading-stop"));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {mode === "signin"
              ? "Sign in to access your saved designs, orders, and account."
              : "Sign up to start browsing handcrafted designs and custom orders."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-lg bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => handleSwitchMode("signin")}
            className={`flex-1 rounded-md py-2 text-xs sm:text-sm font-medium transition-all ${
              mode === "signin"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("signup")}
            className={`flex-1 rounded-md py-2 text-xs sm:text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-800 border border-emerald-200 leading-relaxed">
            <div className="flex items-start gap-2.5">
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
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:border-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <span>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-stone-400">
            or continue with email
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 block w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          )}

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

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
              >
                Password
              </label>
              {mode === "signin" && (
                <Link
                  href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              ref={passwordInputRef}
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-stone-500">
                Must be at least 6 characters.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <Turnstile
              ref={turnstileRef}
              action="signup"
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginContent />
    </Suspense>
  );
}

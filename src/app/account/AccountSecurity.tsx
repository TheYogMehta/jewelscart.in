"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Props {
  email: string;
  hasPassword: boolean;
  isEmailVerified: boolean;
  isGoogleLinked: boolean;
  provider: string;
}

export function AccountSecurity({
  email,
  hasPassword: initialHasPassword,
  isEmailVerified,
  isGoogleLinked: initialIsGoogleLinked,
  provider,
}: Props) {
  const searchParams = useSearchParams();
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [isGoogleLinked] = useState(
    initialIsGoogleLinked || provider === "google",
  );

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const urlError = searchParams.get("error");
  const urlLinked = searchParams.get("linked");
  const expectedParam = searchParams.get("expected") || email;

  const isGmail = email.toLowerCase().endsWith("@gmail.com");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (hasPassword && !currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccess("Password successfully updated and encrypted.");
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    document.cookie = `jc_expected_gmail=${encodeURIComponent(
      email.toLowerCase().trim(),
    )}; path=/; max-age=300; SameSite=Lax`;

    try {
      await signIn("google", { callbackUrl: "/account?linked=true" });
    } catch {
      setConnectingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="border-b border-stone-100 pb-5">
        <span className="text-xs uppercase tracking-[0.15em] text-gold font-semibold">
          Access & Credentials
        </span>
        <h2 className="font-display mt-1 text-2xl font-semibold text-stone-900">
          Sign-In & Security Methods
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-500">
          Configure your authentication credentials, connected Google account,
          and password settings.
        </p>
      </div>

      {/* Account Linking Alerts */}
      {urlError === "different_account" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 animate-in fade-in duration-150">
          You are trying to link a different account. Please link with the same
          account ({expectedParam}).
        </div>
      )}

      {urlLinked === "true" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 animate-in fade-in duration-150">
          Google account successfully connected! You can now sign in with Google
          or your password.
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="divide-y divide-stone-100">
          {/* Email Address & Verification Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 border border-stone-200 text-stone-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Email Address
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{email}</p>
              </div>
            </div>

            <div>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Google Account Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 border border-stone-200">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Google Account
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isGoogleLinked
                    ? "Connected for one-click seamless sign-in."
                    : isGmail && isEmailVerified
                      ? "Connect your verified Google account for fast authentication."
                      : isGmail && !isEmailVerified
                        ? "Verify your email to enable Google linking."
                        : "Only available for @gmail.com accounts."}
                </p>
              </div>
            </div>

            <div>
              {isGoogleLinked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Enabled
                </span>
              ) : isGmail && isEmailVerified ? (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {connectingGoogle ? "Connecting..." : "Connect Google"}
                </button>
              ) : (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-400 border border-stone-200">
                  {!isGmail ? "Unavailable" : "Unverified"}
                </span>
              )}
            </div>
          </div>

          {/* Email & Password Row */}
          <div className="pt-6">
            <div
              onClick={() => setPasswordOpen((prev) => !prev)}
              className="flex cursor-pointer items-center justify-between group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setPasswordOpen((prev) => !prev);
                }
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 border border-stone-200 text-stone-700 group-hover:bg-amber-50/50 group-hover:border-gold/40 group-hover:text-gold transition">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-gold transition">
                    Email & Password
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {hasPassword
                      ? "Password is active. Click to update your password."
                      : "No password configured. Click to set up password access."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    hasPassword
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-stone-100 text-stone-600 border-stone-200"
                  }`}
                >
                  {hasPassword ? "Active" : "Set up"}
                </span>
                <svg
                  className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
                    passwordOpen ? "rotate-180 text-gold" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Inline Password Setup / Change Form */}
            {passwordOpen && (
              <form
                onSubmit={handlePasswordSubmit}
                className="mt-5 rounded-2xl border border-stone-200 bg-stone-50/60 p-6 space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    {hasPassword
                      ? "Change Account Password"
                      : "Create Account Password"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password text" : "Show password text"
                    }
                  >
                    {showPassword ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>

                {passwordError && (
                  <div className="rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                    {passwordSuccess}
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <label
                      htmlFor="current_password"
                      className="block text-xs font-medium text-stone-700"
                    >
                      Current Password
                    </label>
                    <input
                      id="current_password"
                      name="current_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new_password"
                      className="block text-xs font-medium text-stone-700"
                    >
                      New Password
                    </label>
                    <input
                      id="new_password"
                      name="new_password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm_password"
                      className="block text-xs font-medium text-stone-700"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(false)}
                    className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-gold-light disabled:opacity-50 transition cursor-pointer"
                  >
                    {passwordLoading
                      ? "Saving..."
                      : hasPassword
                        ? "Update Password"
                        : "Set Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

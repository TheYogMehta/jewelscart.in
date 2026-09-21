"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"),
  );
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(
  name: string,
  value: string,
  maxAgeSeconds: number = 31536000,
) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function generateVisitorId(): string {
  return (
    "vid_" +
    Math.random().toString(36).substring(2, 15) +
    "_" +
    Date.now().toString(36)
  );
}

export function AccountPrivacyPreferences() {
  const [consent, setConsent] = useState<"accepted" | "declined" | "pending">(
    "pending",
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const current = getCookie("jc_consent");
    if (current === "accepted" || current === "declined") {
      setConsent(current);
    } else {
      setConsent("pending");
    }

    const handleConsentUpdate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "accepted" || detail === "declined") {
        setConsent(detail);
      }
    };

    window.addEventListener("jc:consent-updated", handleConsentUpdate);
    return () =>
      window.removeEventListener("jc:consent-updated", handleConsentUpdate);
  }, []);

  const handleToggle = () => {
    if (consent === "accepted") {
      // Disable
      setCookie("jc_consent", "declined", 31536000);
      removeCookie("jc_vid");
      removeCookie("jc_sid");
      try {
        sessionStorage.removeItem("jc_sid");
      } catch {}
      setConsent("declined");
      setFeedback(
        "Analytics tracking has been disabled. Visitor session IDs cleared.",
      );
      window.dispatchEvent(
        new CustomEvent("jc:consent-updated", { detail: "declined" }),
      );
    } else {
      // Enable
      setCookie("jc_consent", "accepted", 31536000);
      let vid = getCookie("jc_vid");
      if (!vid) {
        vid = generateVisitorId();
        setCookie("jc_vid", vid, 31536000);
      }
      setConsent("accepted");
      setFeedback("Analytics tracking has been enabled.");
      window.dispatchEvent(
        new CustomEvent("jc:consent-updated", { detail: "accepted" }),
      );
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  return (
    <div id="privacy" className="space-y-6 scroll-mt-6">
      {/* Header */}
      <div className="border-b border-stone-100 pb-5">
        <span className="text-xs uppercase tracking-[0.15em] text-gold font-semibold">
          Privacy & Governance
        </span>
        <h2 className="font-display mt-1 text-2xl font-semibold text-stone-900">
          Privacy & Tracking Preferences
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-500">
          Control your analytics tracking, cookie consent, and data protection
          settings.
        </p>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 animate-in fade-in duration-200">
          {feedback}
        </div>
      )}

      {/* Main Privacy Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-5 text-stone-600">
        <p className="text-xs sm:text-sm leading-relaxed">
          We use privacy-first, non-identifiable tracking (anonymized IP hash,
          device category, page views, and session time) to improve website
          performance and browsing. We never sell your data or use 3rd-party
          advertising pixels.
        </p>

        {/* Toggle Control Card */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-stone-900 text-sm">
              {consent === "accepted"
                ? "Analytics tracking is currently enabled"
                : "Analytics tracking is currently disabled"}
            </p>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed max-w-lg">
              {consent === "accepted"
                ? "Your anonymous visit duration and page views help our artisans understand website performance."
                : "No analytics events or visitor IDs are recorded for your browser session."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggle}
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition shadow-xs cursor-pointer ${
                consent === "accepted"
                  ? "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                  : "bg-gold text-white hover:bg-gold-light"
              }`}
            >
              {consent === "accepted" ? "Disable Tracking" : "Enable Tracking"}
            </button>
          </div>
        </div>

        {/* Data Rights & Erasure Section */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            Looking to delete your account or request complete data erasure?{" "}
            <Link
              href="/policy#erasure"
              className="text-gold hover:underline font-medium"
            >
              View Data Erasure Policy
            </Link>
          </div>
          <Link
            href="/policy#privacy"
            className="text-gold hover:underline font-medium shrink-0"
          >
            Read Full Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

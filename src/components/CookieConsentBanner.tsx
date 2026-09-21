"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [manuallyOpened, setManuallyOpened] = useState(false);

  const isExemptRoute =
    pathname.startsWith("/policy") ||
    pathname.startsWith("/terms-of-service") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/about");

  useEffect(() => {
    const handleOpen = () => {
      setManuallyOpened(true);
      setVisible(true);
    };

    window.addEventListener("jc:open-cookie-modal", handleOpen);
    return () => window.removeEventListener("jc:open-cookie-modal", handleOpen);
  }, []);

  useEffect(() => {
    const consent = getCookie("jc_consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie("jc_consent", "accepted", 31536000); // 1 year

    let vid = getCookie("jc_vid");
    if (!vid) {
      vid = generateVisitorId();
      setCookie("jc_vid", vid, 31536000); // 1 year
    }

    setVisible(false);
    setManuallyOpened(false);
    window.dispatchEvent(
      new CustomEvent("jc:consent-updated", { detail: "accepted" }),
    );
  };

  const handleDecline = () => {
    setCookie("jc_consent", "declined", 31536000); // 1 year
    removeCookie("jc_vid");
    removeCookie("jc_sid");
    try {
      sessionStorage.removeItem("jc_sid");
    } catch {}

    setVisible(false);
    setManuallyOpened(false);
    window.dispatchEvent(
      new CustomEvent("jc:consent-updated", { detail: "declined" }),
    );
  };

  const handleClose = () => {
    setVisible(false);
    setManuallyOpened(false);
  };

  if (!visible || (!manuallyOpened && isExemptRoute)) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie & Privacy Choices"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-7">
        {manuallyOpened && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close preferences"
            className="absolute top-4 right-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-gold border border-amber-200/60">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Cookie & Privacy Choices
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              We use essential cookies to maintain your shopping bag, ensure
              accurate visitor deduplication, and understand site traffic. We
              never sell your personal information. Read our{" "}
              <Link
                href="/policy#privacy"
                target="_blank"
                className="font-medium text-gold underline underline-offset-2 transition hover:text-gold-light"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms-of-service"
                target="_blank"
                className="font-medium text-gold underline underline-offset-2 transition hover:text-gold-light"
              >
                Terms of Service
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDecline}
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 text-center"
              >
                Decline Analytics
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-gold-light text-center"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

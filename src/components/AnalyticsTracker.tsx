"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { isTrackablePath } from "@/lib/analytics/guard";

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

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";

  let vid = getCookie("jc_vid") || localStorage.getItem("jc_vid");
  if (!vid) {
    vid =
      "vid_" +
      Math.random().toString(36).substring(2, 15) +
      "_" +
      Date.now().toString(36);
  }
  setCookie("jc_vid", vid, 31536000); // 1y
  try {
    localStorage.setItem("jc_vid", vid);
  } catch {}
  return vid;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("jc_sid");
  if (!sessionId) {
    sessionId =
      "sid_" +
      Math.random().toString(36).substring(2, 15) +
      "_" +
      Date.now().toString(36);
    try {
      sessionStorage.setItem("jc_sid", sessionId);
    } catch {}
  }
  return sessionId;
}

async function getBrowserFingerprintHash(): Promise<string> {
  try {
    const signals: string[] = [];
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 40;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "14px Arial, sans-serif";
        ctx.fillStyle = "#7B4F2E";
        ctx.fillText("JewelsCart \u2728 \u0041\u0042\u0043abc", 10, 24);
        ctx.strokeStyle = "#C9A96E";
        ctx.strokeRect(2, 2, 196, 36);
        signals.push(canvas.toDataURL().slice(-80));
      }
    } catch {}

    signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    signals.push(`${window.devicePixelRatio ?? 1}`);

    signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");

    signals.push(navigator.language ?? "");
    signals.push(navigator.platform ?? "");

    signals.push(String(navigator.hardwareConcurrency ?? 0));

    const raw = signals.join("|");
    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isExcludedRole = Boolean(
    userRole && ["developer", "admin", "staff"].includes(userRole),
  );

  const startTimeRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>(pathname);
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const fingerprintRef = useRef<string>("");

  useEffect(() => {
    const checkConsent = () => {
      const consent = getCookie("jc_consent");
      setConsentGranted(consent === "accepted");
    };

    checkConsent();

    const handleConsentEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setConsentGranted(customEvent.detail === "accepted");
    };

    window.addEventListener("jc:consent-updated", handleConsentEvent);
    return () => {
      window.removeEventListener("jc:consent-updated", handleConsentEvent);
    };
  }, []);

  useEffect(() => {
    if (!consentGranted || fingerprintRef.current) return;
    getBrowserFingerprintHash().then((hash) => {
      fingerprintRef.current = hash;
    });
  }, [consentGranted]);

  const sendPageView = useCallback(
    (path: string, duration: number = 0) => {
      if (!consentGranted || isExcludedRole) return;
      if (!isTrackablePath(path)) return;

      try {
        const sessionId = getOrCreateSessionId();
        const visitorId = getOrCreateVisitorId();

        const payload = JSON.stringify({
          sessionId,
          visitorId,
          fingerprintHash: fingerprintRef.current || undefined,
          path,
          referrer: typeof document !== "undefined" ? document.referrer : "",
          durationSeconds: Math.round(duration),
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/track", blob);
        } else {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // fail silently
      }
    },
    [consentGranted, isExcludedRole],
  );

  useEffect(() => {
    if (!isTrackablePath(pathname)) return;
    if (!consentGranted || isExcludedRole) return;

    if (currentPathRef.current !== pathname) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      if (duration > 1) {
        sendPageView(currentPathRef.current, duration);
      }
      startTimeRef.current = Date.now();
      currentPathRef.current = pathname;
    }

    sendPageView(pathname, 0);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        if (duration > 1) {
          sendPageView(currentPathRef.current, duration);
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, consentGranted, isExcludedRole, sendPageView]);

  return null;
}

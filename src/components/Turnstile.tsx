"use client";

import Script from "next/script";
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  memo,
} from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          size?: "invisible" | "normal" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: (error?: unknown) => void;
          "expired-callback"?: () => void;
          action?: string;
          cData?: string;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute: (containerOrId?: HTMLElement | string) => void;
    };
  }
}

export interface TurnstileRef {
  reset: () => void;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
  action?: string;
  size?: "invisible" | "normal" | "compact";
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export const Turnstile = memo(
  forwardRef<TurnstileRef, TurnstileProps>(function Turnstile(
    {
      onVerify,
      onError,
      onExpire,
      action,
      size = "normal",
      theme = "light",
      className = "my-3 flex justify-center",
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    });

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || !siteKey) return;
      if (widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: size,
          action,
          theme: theme,
          callback: (token: string) => {
            onVerifyRef.current?.(token);
          },
          "error-callback": (err: unknown) => {
            console.warn("[Turnstile] Challenge error:", err);
            onErrorRef.current?.(err);
          },
          "expired-callback": () => {
            onExpireRef.current?.();
          },
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.error("[Turnstile] Render error:", e);
      }
    }, [siteKey, size, theme, action]);

    useEffect(() => {
      if (!siteKey) return;

      if (window.turnstile) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore removal errors on unmount
          }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, renderWidget]);

    if (!siteKey) return null;

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={renderWidget}
          onError={(e) => {
            console.warn(
              "[Turnstile] Cloudflare challenge script failed to load:",
              e,
            );
            onErrorRef.current?.(e);
          }}
        />
        <div
          ref={containerRef}
          className={`${className} min-h-16.25 flex items-center justify-center`}
        />
      </>
    );
  }),
);

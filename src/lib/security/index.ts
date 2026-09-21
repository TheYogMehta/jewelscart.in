export * from "./rate-limit";
export * from "./turnstile";

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function sanitizeCallbackUrl(url: string, baseUrl: string): string {
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  try {
    const resolved = new URL(url, baseUrl);
    const base = new URL(baseUrl);
    if (resolved.origin !== base.origin) return "/";
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return "/";
  }
}

export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;

  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}

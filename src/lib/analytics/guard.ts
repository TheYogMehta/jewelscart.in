export const EXCLUDED_PREFIXES = [
  "/admin",
  "/api",
  "/_next",
  "/account",
  "/policy",
  "/terms-of-service",
  "/contact",
  "/about",
  "/login",
  "/signup",
  "/register",
  "/verify-email",
] as const;

export const EXCLUDED_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

export const EXCLUDED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ico",
  ".webp",
  ".mp4",
  ".webm",
] as const;

export function isTrackablePath(path?: string | null): boolean {
  if (!path) return false;
  const p = path.toLowerCase().trim();

  if (EXCLUDED_PREFIXES.some((prefix) => p.startsWith(prefix))) {
    return false;
  }

  if (EXCLUDED_EXACT.some((exact) => p === exact)) {
    return false;
  }

  if (EXCLUDED_EXTENSIONS.some((ext) => p.endsWith(ext))) {
    return false;
  }

  return true;
}

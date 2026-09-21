import type { NextRequest } from "next/server";
import { extractClientIp } from "./ip";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function getClientIp(request: NextRequest): string {
  return extractClientIp(request.headers);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  if (
    !key ||
    key.endsWith(":") ||
    key.includes(":127.0.0.1") ||
    key.includes(":::1") ||
    key.includes(":localhost")
  ) {
    return true;
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

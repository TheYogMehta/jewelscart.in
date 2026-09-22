export function isLocalIp(ip?: string | null): boolean {
  if (!ip) return true;
  let clean = ip.trim().toLowerCase();
  if (clean.startsWith("::ffff:")) {
    clean = clean.slice(7);
  }

  if (
    !clean ||
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "0.0.0.0" ||
    clean === "::"
  ) {
    return true;
  }

  // RFC-1918 private ranges
  if (clean.startsWith("127.")) return true; // 127.0.0.0/8 loopback
  if (clean.startsWith("10.")) return true; // 10.0.0.0/8
  if (clean.startsWith("192.168.")) return true; // 192.168.0.0/16

  // 172.16.0.0/12 → 172.16.x.x – 172.31.x.x
  const parts = clean.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 ULA (fc00::/7 covers fc and fd prefixes)
  if (clean.startsWith("fc") || clean.startsWith("fd")) return true;

  return false;
}

function getHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) || undefined;
  }
  const val = (headers as Record<string, string | string[] | undefined>)[
    name.toLowerCase()
  ];
  return Array.isArray(val) ? val[0] : val;
}

export function extractClientIp(
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  const cf = getHeader(headers, "cf-connecting-ip")?.trim();
  if (cf && !isLocalIp(cf)) return cf;

  const trueClient = getHeader(headers, "true-client-ip")?.trim();
  if (trueClient && !isLocalIp(trueClient)) return trueClient;

  const realIp = getHeader(headers, "x-real-ip")?.trim();
  if (realIp && !isLocalIp(realIp)) return realIp;

  const forwarded = getHeader(headers, "x-forwarded-for");
  if (forwarded) {
    for (const raw of forwarded.split(",")) {
      const ip = raw.trim();
      if (ip && !isLocalIp(ip)) return ip;
    }
  }

  return "unknown";
}

export function resolveLocationFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined>,
): { city: string; country: string } {
  const city = getHeader(headers, "cf-ipcity")?.trim();
  const country = getHeader(headers, "cf-ipcountry")?.trim();
  return {
    city: city || "Anonymous",
    country: country || "Anonymous",
  };
}

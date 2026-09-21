import crypto from "crypto";
import { connectDB } from "@/lib/db";
import {
  extractClientIp,
  isLocalIp,
  resolveLocationFromHeaders,
} from "@/lib/security/ip";
import { isTrackablePath } from "./guard";

export interface AnalyticsEvent {
  id: number;
  session_id: string;
  visitor_id?: string | null;
  ip_hash?: string | null;
  fingerprint_hash?: string | null;
  user_id?: number | null;
  path: string;
  referrer?: string | null;
  duration_seconds: number;
  ip?: string | null;
  city?: string | null;
  country?: string | null;
  device_type?: string | null;
  created_at: Date;
}

export function detectDeviceType(
  userAgent?: string | null,
): "desktop" | "mobile" | "tablet" | "anonymous" {
  if (!userAgent || !userAgent.trim()) return "anonymous";
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return "mobile";
  }
  if (
    ua.includes("windows") ||
    ua.includes("macintosh") ||
    ua.includes("linux")
  ) {
    return "desktop";
  }
  return "anonymous";
}

export async function recordAnalyticsEvent(data: {
  sessionId: string;
  visitorId?: string | null;
  fingerprintHash?: string | null;
  userId?: number | null;
  path: string;
  referrer?: string | null;
  durationSeconds?: number;
  ip?: string | null;
  city?: string | null;
  country?: string | null;
  deviceType?: string | null;
  request?: Request;
}): Promise<void> {
  if (!isTrackablePath(data.path)) {
    return;
  }

  try {
    const pool = await connectDB();

    let ip = data.ip;
    let city = data.city;
    let country = data.country;
    let deviceType = data.deviceType;
    let userAgent = "";

    if (data.request) {
      const headers = data.request.headers;
      userAgent = headers.get("user-agent") || "";
      if (!ip) ip = extractClientIp(headers);
      if (!city || !country) {
        const loc = resolveLocationFromHeaders(headers);
        if (!city) city = loc.city;
        if (!country) country = loc.country;
      }
      if (!deviceType) {
        deviceType = detectDeviceType(userAgent);
      }
    }

    if (!ip || isLocalIp(ip)) {
      return;
    }

    if (!city) city = "Anonymous";
    if (!country) country = "Anonymous";
    if (!deviceType) deviceType = "anonymous";

    const salt = process.env.AUTH_SECRET;
    const ipHash = crypto
      .createHash("sha256")
      .update(`${ip}_${userAgent}_${salt}`)
      .digest("hex");

    const visitorId = data.visitorId
      ? String(data.visitorId).slice(0, 100)
      : null;
    const fingerprintHash = data.fingerprintHash
      ? String(data.fingerprintHash).slice(0, 64)
      : null;
    const sessionId = String(data.sessionId).slice(0, 100);
    const duration = data.durationSeconds
      ? Math.min(Math.max(0, data.durationSeconds), 3600)
      : 0;

    const recentRes = await pool.query(
      `SELECT id, duration_seconds FROM analytics_events 
       WHERE (
         ($1::VARCHAR IS NOT NULL AND visitor_id = $1)
         OR ($5::VARCHAR IS NOT NULL AND fingerprint_hash = $5)
         OR ip_hash = $2
         OR session_id = $3
       )
       AND path = $4
       AND created_at >= NOW() - INTERVAL '15 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [visitorId, ipHash, sessionId, data.path, fingerprintHash],
    );

    if (recentRes.rows.length > 0) {
      if (duration > 0) {
        await pool.query(
          `UPDATE analytics_events 
           SET duration_seconds = duration_seconds + $1 
           WHERE id = $2`,
          [duration, recentRes.rows[0].id],
        );
      }
      return;
    }

    await pool.query(
      `INSERT INTO analytics_events 
        (session_id, visitor_id, ip_hash, fingerprint_hash, user_id, path, referrer, duration_seconds, ip, city, country, device_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        sessionId,
        visitorId,
        ipHash,
        fingerprintHash,
        data.userId ?? null,
        data.path,
        data.referrer ?? null,
        duration,
        ip ?? null,
        city,
        country,
        deviceType,
      ],
    );
  } catch (err) {
    console.error("[Analytics] Failed to record event:", err);
  }
}

export interface AnalyticsOverview {
  totalVisits: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
  avgDurationMembers: number;
  avgDurationAnonymous: number;
  loggedInVisits: number;
  anonymousVisits: number;
  dailyTimeSeries: { date: string; visits: number; unique: number }[];
  hotspots: {
    path: string;
    count: number;
    avgDuration: number;
    percentage: number;
  }[];
  topLocations: {
    city: string;
    country: string;
    count: number;
    percentage: number;
  }[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
    anonymous: number;
  };
  referrers: { source: string; count: number; percentage: number }[];
}

export async function getAnalyticsOverview(
  days: number = 14,
): Promise<AnalyticsOverview> {
  const pool = await connectDB();

  const summaryRes = await pool.query(
    `SELECT 
      COUNT(*) AS total_visits,
      COUNT(DISTINCT COALESCE(visitor_id, fingerprint_hash, ip_hash, session_id)) AS unique_visitors,
      COALESCE(AVG(duration_seconds), 0) AS avg_duration,
      COALESCE(AVG(CASE WHEN user_id IS NOT NULL THEN duration_seconds END), 0) AS avg_duration_members,
      COALESCE(AVG(CASE WHEN user_id IS NULL THEN duration_seconds END), 0) AS avg_duration_anonymous,
      COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) AS logged_in_visits,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) AS anonymous_visits
     FROM analytics_events
     WHERE path NOT LIKE '/admin%' 
       AND path NOT LIKE '/api%'
       AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
    [days],
  );

  const summary = summaryRes.rows[0] || {};
  const totalVisits = parseInt(summary.total_visits ?? "0", 10);
  const uniqueVisitors = parseInt(summary.unique_visitors ?? "0", 10);
  const avgDurationSeconds = Math.round(
    parseFloat(summary.avg_duration ?? "0"),
  );
  const avgDurationMembers = Math.round(
    parseFloat(summary.avg_duration_members ?? "0"),
  );
  const avgDurationAnonymous = Math.round(
    parseFloat(summary.avg_duration_anonymous ?? "0"),
  );
  const loggedInVisits = parseInt(summary.logged_in_visits ?? "0", 10);
  const anonymousVisits = parseInt(summary.anonymous_visits ?? "0", 10);

  const timeSeriesRes = await pool.query(
    `SELECT 
      TO_CHAR(d.day, 'DD Mon') as date,
      COUNT(e.id) as visits,
      COUNT(DISTINCT COALESCE(e.visitor_id, e.fingerprint_hash, e.ip_hash, e.session_id)) as unique_sessions
     FROM (
       SELECT generate_series(
         date_trunc('day', NOW() - ($1 || ' days')::INTERVAL),
         date_trunc('day', NOW()),
         '1 day'::INTERVAL
       ) as day
     ) d
     LEFT JOIN analytics_events e 
       ON date_trunc('day', e.created_at) = d.day
       AND e.path NOT LIKE '/admin%'
       AND e.path NOT LIKE '/api%'
     GROUP BY d.day
     ORDER BY d.day ASC`,
    [days],
  );

  const dailyTimeSeries = timeSeriesRes.rows.map((r) => ({
    date: r.date,
    visits: parseInt(r.visits ?? "0", 10),
    unique: parseInt(r.unique_sessions ?? "0", 10),
  }));

  const hotspotsRes = await pool.query(
    `SELECT path, COUNT(*) as count, COALESCE(AVG(duration_seconds), 0) as avg_duration
     FROM analytics_events
     WHERE path NOT LIKE '/admin%'
       AND path NOT LIKE '/api%'
       AND created_at >= NOW() - ($1 || ' days')::INTERVAL
     GROUP BY path
     ORDER BY count DESC
     LIMIT 8`,
    [days],
  );

  const hotspots = hotspotsRes.rows.map((r) => {
    const count = parseInt(r.count, 10);
    const avgDuration = Math.round(parseFloat(r.avg_duration ?? "0"));
    return {
      path: r.path,
      count,
      avgDuration,
      percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
    };
  });

  const locationsRes = await pool.query(
    `SELECT COALESCE(city, 'Anonymous') as city, COALESCE(country, 'Anonymous') as country, COUNT(*) as count
     FROM analytics_events
     WHERE path NOT LIKE '/admin%'
       AND path NOT LIKE '/api%'
       AND created_at >= NOW() - ($1 || ' days')::INTERVAL
     GROUP BY city, country
     ORDER BY count DESC
     LIMIT 8`,
    [days],
  );

  const topLocations = locationsRes.rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      city: r.city,
      country: r.country,
      count,
      percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
    };
  });

  const deviceRes = await pool.query(
    `SELECT 
      COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop,
      COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile,
      COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet,
      COUNT(CASE WHEN device_type = 'anonymous' OR (device_type NOT IN ('desktop', 'mobile', 'tablet')) THEN 1 END) as anonymous
     FROM analytics_events
     WHERE path NOT LIKE '/admin%'
       AND path NOT LIKE '/api%'
       AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
    [days],
  );

  const deviceData = deviceRes.rows[0] || {};
  const deviceBreakdown = {
    desktop: parseInt(deviceData.desktop ?? "0", 10),
    mobile: parseInt(deviceData.mobile ?? "0", 10),
    tablet: parseInt(deviceData.tablet ?? "0", 10),
    anonymous: parseInt(deviceData.anonymous ?? "0", 10),
  };

  const referrersRes = await pool.query(
    `SELECT 
      CASE 
        WHEN referrer IS NULL OR referrer = '' OR referrer LIKE '%jewelscart%' THEN 'Direct'
        WHEN LOWER(referrer) LIKE '%google%' THEN 'Google'
        WHEN LOWER(referrer) LIKE '%instagram%' THEN 'Instagram'
        WHEN LOWER(referrer) LIKE '%facebook%' OR LOWER(referrer) LIKE '%fb%' THEN 'Facebook'
        WHEN LOWER(referrer) LIKE '%twitter%' OR LOWER(referrer) LIKE '%t.co%' OR LOWER(referrer) LIKE '%x.com%' THEN 'Twitter / X'
        WHEN LOWER(referrer) LIKE '%pinterest%' THEN 'Pinterest'
        ELSE 'Other'
      END as source,
      COUNT(*) as count
     FROM analytics_events
     WHERE path NOT LIKE '/admin%'
       AND path NOT LIKE '/api%'
       AND created_at >= NOW() - ($1 || ' days')::INTERVAL
     GROUP BY source
     ORDER BY count DESC`,
    [days],
  );

  const referrers = referrersRes.rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      source: r.source as string,
      count,
      percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
    };
  });

  return {
    totalVisits,
    uniqueVisitors,
    avgDurationSeconds,
    avgDurationMembers,
    avgDurationAnonymous,
    loggedInVisits,
    anonymousVisits,
    dailyTimeSeries,
    hotspots,
    topLocations,
    deviceBreakdown,
    referrers,
  };
}

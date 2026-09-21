import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { isTrackablePath } from "@/lib/analytics/guard";
import { extractClientIp } from "@/lib/security/ip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim().split("="))
        .filter(([k]) => Boolean(k))
        .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]),
    );

    // If user explicitly declined cookie permissions, never track
    if (cookies["jc_consent"] === "declined") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const body = await request.json().catch(() => ({}));
    const {
      sessionId,
      visitorId: bodyVisitorId,
      path,
      referrer,
      durationSeconds,
      fingerprintHash,
    } = body;

    if (!sessionId || !path) {
      return NextResponse.json(
        { ok: false, message: "Missing sessionId or path" },
        { status: 400 },
      );
    }

    if (!isTrackablePath(path)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const clientIp = extractClientIp(request.headers);
    if (!clientIp) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const session = await auth();
    const userRole = session?.user?.role;

    if (userRole && ["developer", "admin", "staff"].includes(userRole)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    const visitorId = cookies["jc_vid"] || bodyVisitorId || null;

    await recordAnalyticsEvent({
      sessionId: String(sessionId).slice(0, 100),
      visitorId: visitorId ? String(visitorId).slice(0, 100) : null,
      fingerprintHash:
        fingerprintHash && typeof fingerprintHash === "string"
          ? String(fingerprintHash).slice(0, 64)
          : null,
      userId: userId && !isNaN(userId) ? userId : null,
      path: String(path).slice(0, 255),
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      durationSeconds:
        typeof durationSeconds === "number"
          ? Math.min(Math.max(0, durationSeconds), 3600)
          : 0,
      ip: clientIp,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Analytics Track API] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

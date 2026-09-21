import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  getPageContent,
  updatePageContent,
  uploadHeroMedia,
} from "@/lib/content";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") as
    | "home"
    | "about"
    | "contact"
    | "discover"
    | null;

  if (page && ["home", "about", "contact", "discover"].includes(page)) {
    const content = await getPageContent(page, { fresh: true });
    return NextResponse.json(content);
  }

  const [home, about, contact, discover] = await Promise.all([
    getPageContent("home", { fresh: true }),
    getPageContent("about", { fresh: true }),
    getPageContent("contact", { fresh: true }),
    getPageContent("discover", { fresh: true }),
  ]);

  return NextResponse.json({ home, about, contact, discover });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let pageKey = "home";
    let updateData: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      pageKey = String(formData.get("page_key") || "home");

      if (formData.has("title")) {
        const t = String(formData.get("title")).trim();
        if (!t) {
          return NextResponse.json(
            { error: "Title is required" },
            { status: 400 },
          );
        }
        if (t.length > 150) {
          return NextResponse.json(
            { error: "Title must be 150 characters or less" },
            { status: 400 },
          );
        }
        updateData.title = t;
      }
      if (formData.has("subtitle")) {
        const s = String(formData.get("subtitle")).trim();
        if (s.length > 1000) {
          return NextResponse.json(
            { error: "Hero subtitle must be 1000 characters or less" },
            { status: 400 },
          );
        }
        updateData.subtitle = s;
      }
      if (formData.has("badge_text")) {
        const b = String(formData.get("badge_text")).trim();
        if (b.length > 80) {
          return NextResponse.json(
            { error: "Small badge header must be 80 characters or less" },
            { status: 400 },
          );
        }
        updateData.badge_text = b;
      }
      if (formData.has("bg_type"))
        updateData.bg_type = String(formData.get("bg_type"));
      if (formData.has("bg_url"))
        updateData.bg_url = String(formData.get("bg_url"));

      const file = formData.get("media_file");
      if (file instanceof File && file.size > 0) {
        if (file.size > 100 * 1024 * 1024) {
          return NextResponse.json(
            {
              error:
                "File size must be under 100MB (Cloudflare maximum upload limit)",
            },
            { status: 400 },
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadedUrl = await uploadHeroMedia(
          buffer,
          file.name,
          file.type,
          pageKey,
        );
        updateData.bg_url = `${uploadedUrl}?v=${Date.now()}`;
        updateData.bg_type = file.type.startsWith("video/") ? "video" : "image";
      }
    } else {
      const body = await request.json();
      pageKey = body.page_key || "home";

      if (body.title !== undefined) {
        const t = String(body.title).trim();
        if (!t) {
          return NextResponse.json(
            { error: "Title is required" },
            { status: 400 },
          );
        }
        if (t.length > 150) {
          return NextResponse.json(
            { error: "Title must be 150 characters or less" },
            { status: 400 },
          );
        }
        body.title = t;
      }
      if (body.subtitle !== undefined) {
        const s = String(body.subtitle).trim();
        if (s.length > 1000) {
          return NextResponse.json(
            { error: "Hero subtitle must be 1000 characters or less" },
            { status: 400 },
          );
        }
        body.subtitle = s;
      }
      if (body.badge_text !== undefined) {
        const b = String(body.badge_text).trim();
        if (b.length > 80) {
          return NextResponse.json(
            { error: "Small badge header must be 80 characters or less" },
            { status: 400 },
          );
        }
        body.badge_text = b;
      }

      updateData = body;
    }

    if (!["home", "about", "contact", "discover"].includes(pageKey)) {
      return NextResponse.json({ error: "Invalid page_key" }, { status: 400 });
    }

    const updated = await updatePageContent(pageKey, updateData);

    await logActivity({
      action: "hero_content_edit",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "site_content",
      targetId: pageKey,
      targetName: `${pageKey.toUpperCase()} Hero Section`,
      details: { updatedFields: Object.keys(updateData) },
      request,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[SiteContent API] Error:", err);
    return NextResponse.json(
      { error: "Failed to update page content" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  listCategories,
  listAllCategories,
  listCategoryPaths,
  createCategory,
} from "@/lib/categories";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  parent_id: z.number().nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  banner_url: z.string().nullable().optional(),
  banner_type: z.enum(["image", "video"]).optional(),
  show_in_header: z.boolean().optional(),
  header_order: z.number().int().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerOnly = searchParams.get("header") === "true";
    const pathsOnly = searchParams.get("paths") === "true";
    const all =
      searchParams.get("all") === "true" || searchParams.get("flat") === "true";

    let data;
    if (pathsOnly) {
      data = await listCategoryPaths({ fresh: true });
    } else if (all) {
      data = await listAllCategories({ fresh: true });
    } else {
      data = await listCategories({
        showInHeaderOnly: headerOnly,
        fresh: true,
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("[Categories API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
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
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const category = await createCategory(parsed.data);

    await logActivity({
      action: "category_create",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "category",
      targetId: String(category.id),
      targetName: category.name,
      details: { slug: category.slug },
      request,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("[Categories API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

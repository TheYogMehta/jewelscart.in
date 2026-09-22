import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/lib/categories";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  parent_id: z.number().nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  banner_url: z.string().nullable().optional(),
  banner_type: z.enum(["image", "video"]).optional(),
  is_visible: z.boolean().optional(),
  header_order: z.number().int().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const category = await getCategoryById(id);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: Request, context: RouteContext) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getCategoryById(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const updated = await updateCategory(id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 },
      );
    }

    await logActivity({
      action: "category_edit",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "category",
      targetId: String(id),
      targetName: updated.name,
      details: { updatedFields: Object.keys(parsed.data) },
      request,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Category PUT API] Error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getCategoryById(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const deleted = await deleteCategory(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }

  await logActivity({
    action: "category_delete",
    actorId: session.user.id ? parseInt(session.user.id, 10) : null,
    actorEmail: session.user.email,
    actorName: session.user.name,
    targetType: "category",
    targetId: String(id),
    targetName: existing.name,
    details: { slug: existing.slug },
    request,
  });

  return NextResponse.json({ ok: true });
}

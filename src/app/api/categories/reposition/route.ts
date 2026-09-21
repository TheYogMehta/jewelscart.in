import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/rbac";
import { repositionCategory } from "@/lib/categories";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

const repositionSchema = z.object({
  nodeId: z.number().int(),
  newParentId: z.number().int().nullable(),
  siblingOrders: z
    .array(
      z.object({
        id: z.number().int(),
        order: z.number().int(),
      }),
    )
    .optional(),
});

export const dynamic = "force-dynamic";

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
    const parsed = repositionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { nodeId, newParentId, siblingOrders } = parsed.data;
    await repositionCategory({ nodeId, newParentId, siblingOrders });

    await logActivity({
      action: "category_repositioned",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "category",
      targetId: String(nodeId),
      details: { newParentId, siblingOrdersCount: siblingOrders?.length ?? 0 },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to reposition category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

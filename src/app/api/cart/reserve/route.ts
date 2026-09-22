import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifySameOrigin } from "@/lib/security";
import {
  reserveCartItems,
  releaseReservationForUser,
} from "@/lib/cart/reservation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  quantity: z.number().min(1),
});

const reserveSchema = z.object({
  items: z.array(itemSchema).min(1),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const originCheck = verifySameOrigin(request);
    if (!originCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await auth();
    const userId = session?.user?.id
      ? parseInt(String(session.user.id), 10)
      : null;

    const { searchParams } = new URL(request.url);
    const releaseSessionId = searchParams.get("sessionId");
    if (searchParams.get("action") === "release" && releaseSessionId) {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await releaseReservationForUser(releaseSessionId, userId);
      return NextResponse.json({ success: true });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reserveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error },
        { status: 400 },
      );
    }

    const { items, sessionId } = parsed.data;
    const formattedItems = items.map((i) => ({
      productId:
        typeof i.productId === "string"
          ? parseInt(i.productId, 10)
          : i.productId,
      quantity: i.quantity,
    }));
    const result = await reserveCartItems(sessionId, userId, formattedItems);

    if (!result?.success) {
      return NextResponse.json(
        { error: "Reservation failed", details: result },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cart reserve POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const originCheck = verifySameOrigin(request);
    if (!originCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await auth();
    const userId = session?.user?.id
      ? parseInt(String(session.user.id), 10)
      : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      try {
        const body = await request.json();
        sessionId = body?.sessionId;
      } catch {
        // body might be empty
      }
    }

    if (sessionId) {
      await releaseReservationForUser(sessionId, userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart reserve DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

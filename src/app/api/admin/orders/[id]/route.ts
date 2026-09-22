import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  getOrderById,
  updateOrderStatus,
  setOrderTracking,
} from "@/lib/orders";
import { sendTrackingUpdateEmail } from "@/lib/mail";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_status"),
    status: z.string(),
    adminNotes: z.string().optional(),
  }),
  z.object({
    action: z.literal("set_tracking"),
    trackingId: z.string(),
    trackingUrl: z.string().optional(),
    courier: z.string().optional(),
    sendEmail: z.boolean().optional(),
  }),
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!verifySameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;
    let updatedOrder;

    switch (data.action) {
      case "update_status":
        updatedOrder = await updateOrderStatus(
          orderId,
          data.status,
          data.adminNotes,
        );
        await logActivity({
          actorId: parseInt(String(session.user.id)),
          action: "order_status_update",
          details: { orderId, status: data.status, notes: data.adminNotes },
        });
        break;
      case "set_tracking":
        updatedOrder = await setOrderTracking(orderId, {
          trackingId: data.trackingId,
          trackingUrl: data.trackingUrl,
          courier: data.courier,
        });
        await logActivity({
          actorId: parseInt(String(session.user.id)),
          action: "order_tracking_set",
          details: {
            orderId,
            trackingId: data.trackingId,
            courier: data.courier,
          },
        });

        if (data.sendEmail) {
          if (updatedOrder && updatedOrder.userEmail) {
            await sendTrackingUpdateEmail(updatedOrder.userEmail, {
              orderNumber: updatedOrder.orderNumber,
              userName: updatedOrder.userName || "Valued Customer",
              trackingId: data.trackingId,
              trackingUrl: data.trackingUrl,
              trackingCourier: data.courier,
            });
            await logActivity({
              actorId: parseInt(String(session.user.id)),
              action: "order_tracking_email_sent",
              details: { orderId, email: updatedOrder.userEmail },
            });
          }
        }
        break;
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

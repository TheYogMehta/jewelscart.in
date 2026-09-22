import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { verifySameOrigin } from "@/lib/security";
import { createOrder } from "@/lib/orders";
import { releaseReservationForUser } from "@/lib/cart/reservation";
import { calculateShippingFee } from "@/lib/cart/shipping";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { logActivity } from "@/lib/logs";
import { connectDB } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  name: z.string().optional(),
  slug: z.string().optional(),
  image: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  quantity: z.number().min(1),
});

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6),
});

const verifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  items: z.array(itemSchema).min(1),
  deliveryAddress: addressSchema,
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const originCheck = verifySameOrigin(request);
    if (!originCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error },
        { status: 400 },
      );
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      items,
      deliveryAddress,
      sessionId,
    } = parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret not configured");
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Zero-Trust Pricing: Calculate subtotal, prices and shipping strictly from DB
    const productIds = items.map((i) =>
      typeof i.productId === "string" ? parseInt(i.productId, 10) : i.productId,
    );

    const db = await connectDB();
    const dbProductsRes = await db.query(
      "SELECT id, name, slug, image, sku, price FROM products WHERE id = ANY($1::int[])",
      [productIds],
    );

    const dbProductMap = new Map<number, any>(
      dbProductsRes.rows.map((p: any) => [p.id, p]),
    );

    let serverSubtotal = 0;
    const verifiedOrderItems = items.map((item) => {
      const pId =
        typeof item.productId === "string"
          ? parseInt(item.productId, 10)
          : item.productId;
      const dbProduct = dbProductMap.get(pId);
      const unitPrice = dbProduct ? parseFloat(dbProduct.price) : 0;
      serverSubtotal += unitPrice * item.quantity;

      return {
        productId: pId,
        productName: dbProduct?.name || item.name || "Jewellery Item",
        productSlug: dbProduct?.slug || item.slug || "",
        productImage: dbProduct?.image || item.image || "",
        productSku: dbProduct?.sku || item.sku || "",
        quantity: item.quantity,
        unitPrice,
      };
    });

    const shippingResult = calculateShippingFee(
      serverSubtotal,
      deliveryAddress.state,
    );
    const serverShippingFee = shippingResult.fee;
    const serverTotalAmount = serverSubtotal + serverShippingFee;

    const userId = parseInt(String(session.user.id), 10);

    const orderData = {
      userId,
      userEmail: session.user.email || undefined,
      userName: session.user.name || undefined,
      items: verifiedOrderItems,
      shippingAddress: deliveryAddress,
      subtotal: serverSubtotal,
      shippingFee: serverShippingFee,
      totalAmount: serverTotalAmount,
      paymentId: razorpay_payment_id,
      paymentOrderId: razorpay_order_id,
      paymentSignature: razorpay_signature,
      paymentMethod: "razorpay",
    };

    const newOrder = await createOrder(orderData);

    // Release stock reservation owned by user
    await releaseReservationForUser(sessionId, userId);

    if (session.user.email && newOrder) {
      sendOrderConfirmationEmail(session.user.email, {
        orderNumber: newOrder.orderNumber,
        userName: session.user.name || "Valued Customer",
        items: verifiedOrderItems.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          image: item.productImage,
          sku: item.productSku,
        })),
        subtotal: serverSubtotal,
        shippingFee: serverShippingFee,
        totalAmount: serverTotalAmount,
        shippingAddress: deliveryAddress,
        paymentId: razorpay_payment_id,
        createdAt: new Date().toISOString(),
        paymentMethod: newOrder.paymentMethod || "Razorpay",
      }).catch((err: unknown) => {
        console.error("Failed to send order confirmation email:", err);
      });
    }

    await logActivity({
      action: "order_placed",
      actorId: userId,
      actorEmail: session.user.email || undefined,
      actorName: session.user.name || undefined,
      targetType: "order",
      targetId: String(newOrder.id),
      targetName: newOrder.orderNumber,
      details: {
        totalAmount: serverTotalAmount,
        paymentId: razorpay_payment_id,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      order: { orderNumber: newOrder.orderNumber, id: newOrder.id },
    });
  } catch (error) {
    console.error("Verify checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

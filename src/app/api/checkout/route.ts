import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifySameOrigin } from "@/lib/security";
import { reserveCartItems } from "@/lib/cart/reservation";
import { calculateShippingFee } from "@/lib/cart/shipping";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string(),
  sku: z.string(),
  price: z.number().min(0),
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

const checkoutSchema = z.object({
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
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error },
        { status: 400 },
      );
    }

    const { items, deliveryAddress, sessionId } = parsed.data;

    const reserveResult = await reserveCartItems(
      sessionId,
      parseInt(String(session.user.id)),
      items.map((item) => ({
        productId: parseInt(item.productId),
        quantity: item.quantity,
      })),
    );

    if (!reserveResult?.success) {
      return NextResponse.json(
        { error: "Some items could not be reserved", details: reserveResult },
        { status: 400 },
      );
    }

    const subtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const shippingResult = calculateShippingFee(
      subtotal,
      deliveryAddress.state,
    );
    const total = subtotal + shippingResult.fee;
    const totalInPaise = Math.round(total * 100);

    const razorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const authHeader = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`,
    ).toString("base64");

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: totalInPaise,
        currency: "INR",
        receipt: sessionId,
        notes: {
          user_email: session.user.email || "",
          delivery_city: deliveryAddress.city,
        },
      }),
    });

    if (!razorpayRes.ok) {
      const rpError = await razorpayRes.json();
      return NextResponse.json(
        { error: "Failed to create Razorpay order", details: rpError },
        { status: 500 },
      );
    }

    const rpOrder = await razorpayRes.json();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return NextResponse.json({
      razorpayOrderId: rpOrder.id,
      amount: totalInPaise,
      sessionId,
      expiresAt,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

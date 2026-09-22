import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth/users";
import { getOrdersByUserId } from "@/lib/orders";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await getOrdersByUserId(user.id, user.email);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[Account Orders API] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

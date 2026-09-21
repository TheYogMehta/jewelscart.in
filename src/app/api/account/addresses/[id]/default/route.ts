import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth/users";
import { setDefaultAddress, getAddressById } from "@/lib/addresses";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id, 10);
  if (isNaN(addressId)) {
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  try {
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await getAddressById(addressId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const updated = await setDefaultAddress(user.id, addressId);

    await logActivity({
      action: "address_set_default",
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      targetType: "address",
      targetId: String(updated.id),
      targetName: `${updated.full_name} (${updated.address_type})`,
      details: {
        city: updated.city,
        state: updated.state,
        postal_code: updated.postal_code,
      },
      request,
    });

    return NextResponse.json({
      ok: true,
      address: updated,
      message: "Default address updated",
    });
  } catch (err) {
    console.error("[Account Address API] PATCH Default Error:", err);
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 },
    );
  }
}

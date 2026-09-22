import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth/users";
import {
  getAddressById,
  updateAddress,
  deleteAddress,
  addressSchema,
} from "@/lib/addresses";
import { validatePostalCodeMatch } from "@/lib/location";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PUT(
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
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid address data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const postalCheck = await validatePostalCodeMatch(
      parsed.data.postal_code,
      parsed.data.state,
      parsed.data.country,
    );
    if (!postalCheck.valid) {
      return NextResponse.json(
        {
          error: postalCheck.error || "Invalid PIN code for selected location",
        },
        { status: 400 },
      );
    }

    const updated = await updateAddress(user.id, addressId, parsed.data);

    return NextResponse.json({
      ok: true,
      address: updated,
      message: "Address updated successfully",
    });
  } catch (err) {
    console.error("[Account Address API] PUT Error:", err);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const deleted = await deleteAddress(user.id, addressId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete address" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.error("[Account Address API] DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}

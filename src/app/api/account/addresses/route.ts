import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth/users";
import {
  getAddressesByUserId,
  createAddress,
  addressSchema,
} from "@/lib/addresses";
import { validatePostalCodeMatch } from "@/lib/location";
import { logActivity } from "@/lib/logs";
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

    const addresses = await getAddressesByUserId(user.id);
    return NextResponse.json({ addresses });
  } catch (err) {
    console.error("[Account Addresses API] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const newAddress = await createAddress(user.id, parsed.data);

    await logActivity({
      action: "address_create",
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      targetType: "address",
      targetId: String(newAddress.id),
      targetName: `${newAddress.full_name} (${newAddress.address_type})`,
      details: {
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        is_default: newAddress.is_default,
      },
      request,
    });

    return NextResponse.json({
      ok: true,
      address: newAddress,
      message: "Address saved successfully",
    });
  } catch (err) {
    console.error("[Account Addresses API] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 },
    );
  }
}

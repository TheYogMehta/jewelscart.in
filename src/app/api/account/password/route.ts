import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  setPasswordForUser,
  findUserByEmail,
  verifyPassword,
} from "@/lib/auth/users";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});

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
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid password";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password_hash) {
      if (!parsed.data.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password." },
          { status: 400 },
        );
      }

      const isCurrentValid = verifyPassword(
        parsed.data.currentPassword,
        user.password_hash,
      );
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Incorrect current password. Please try again." },
          { status: 400 },
        );
      }
    }

    await setPasswordForUser(user.id, parsed.data.password);

    await logActivity({
      action: "password_update",
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      targetType: "user",
      targetId: String(user.id),
      targetName: user.email,
      details: { method: "account_security_form" },
      request,
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("[Account Password API] Error:", err);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 },
    );
  }
}

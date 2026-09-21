import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { findUserByEmail, updateUserProfile } from "@/lib/auth/users";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters"),
});

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid profile data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await updateUserProfile(user.id, parsed.data.name);

    await logActivity({
      action: "profile_update",
      actorId: user.id,
      actorEmail: user.email,
      actorName: updatedUser.name,
      targetType: "user",
      targetId: String(user.id),
      targetName: user.email,
      details: { previousName: user.name, newName: updatedUser.name },
      request,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("[Account Profile API] Error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/auth/config";
import { canCreateRole, canEditUserRole, canDeleteUser } from "@/lib/auth/rbac";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  getUserCounts,
  listUsers,
  searchUsers,
  updateUserRole,
  createVerificationToken,
  type UserTabFilter,
} from "@/lib/auth/users";
import { isEmailVerificationEnabled, sendVerificationEmail } from "@/lib/mail";
import { logActivity } from "@/lib/logs";
import { verifySameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["developer", "admin", "staff", "user"]),
});

const updateUserRoleSchema = z.object({
  userId: z.number().int().positive("Invalid user ID"),
  role: z.enum(["developer", "admin", "staff", "user"]),
});

const deleteUserSchema = z.object({
  userId: z.number().int().positive("Invalid user ID"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const rawFilter = searchParams.get("filter");
    const filter: UserTabFilter =
      rawFilter === "customer" || rawFilter === "team" || rawFilter === "all"
        ? rawFilter
        : "team";

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const rawPageSize = parseInt(searchParams.get("pageSize") || "12", 10);
    const pageSize =
      isNaN(rawPageSize) || rawPageSize < 1 ? 12 : Math.min(rawPageSize, 100);

    const counts = await getUserCounts(session.user.role);

    const result =
      query && query.trim()
        ? await searchUsers(query, session.user.role, filter, page, pageSize)
        : await listUsers(session.user.role, filter, page, pageSize);

    return NextResponse.json({
      users: result.users,
      counts,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("[API/Admin/Users GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { userId, role } = parsed.data;
    const actorRole = session.user.role;

    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf =
      (session.user.email &&
        targetUser.email.toLowerCase() === session.user.email.toLowerCase()) ||
      (session.user.id && String(session.user.id) === String(targetUser.id));

    if (isSelf) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 },
      );
    }

    if (targetUser.role === "developer") {
      return NextResponse.json(
        { error: "Developer accounts are permanent and cannot be modified." },
        { status: 400 },
      );
    }

    if (!canEditUserRole(actorRole, targetUser.role, role)) {
      if (actorRole === "admin") {
        return NextResponse.json(
          {
            error:
              "Admins can only assign Staff or User roles, and cannot modify Developer accounts.",
          },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "You do not have permission to modify this user's role." },
        { status: 403 },
      );
    }

    const updatedUser = await updateUserRole(userId, role);

    await logActivity({
      action: "user_role_update",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "user",
      targetId: String(updatedUser.id),
      targetName: updatedUser.email,
      details: { previousRole: targetUser.role, newRole: updatedUser.role },
      request,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        provider: updatedUser.provider,
        email_verified: updatedUser.email_verified,
        created_at: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error("[API/Admin/Users PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;
    const actorRole = session.user.role;

    if (!canCreateRole(actorRole, role)) {
      if (actorRole === "admin") {
        return NextResponse.json(
          {
            error:
              "Admins (website owners) can only create staff or user accounts.",
          },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "You do not have permission to assign this role." },
        { status: 403 },
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 400 },
      );
    }

    const verificationEnabled = isEmailVerificationEnabled();

    const newUser = await createUser({
      name,
      email,
      password,
      role,
      provider: "credentials",
      emailVerified: !verificationEnabled,
    });

    if (verificationEnabled) {
      try {
        const token = await createVerificationToken(newUser.id);
        await sendVerificationEmail(newUser.email, newUser.name, token);
      } catch (mailError) {
        console.error(
          "[API/Admin/Users] Failed to dispatch verification email:",
          mailError,
        );
      }
    }

    await logActivity({
      action: "user_create",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "user",
      targetId: String(newUser.id),
      targetName: newUser.email,
      details: { role: newUser.role },
      request,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          provider: newUser.provider,
          created_at: newUser.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API/Admin/Users POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create user. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { userId } = parsed.data;
    const actorRole = session.user.role;

    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf =
      (session.user.email &&
        targetUser.email.toLowerCase() === session.user.email.toLowerCase()) ||
      (session.user.id && String(session.user.id) === String(targetUser.id));

    if (isSelf) {
      return NextResponse.json(
        { error: "You cannot delete your own account from the user manager." },
        { status: 400 },
      );
    }

    if (targetUser.role === "developer") {
      return NextResponse.json(
        { error: "Developer accounts cannot be deleted." },
        { status: 400 },
      );
    }

    if (!canDeleteUser(actorRole, targetUser.role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this account." },
        { status: 403 },
      );
    }

    const deleted = await deleteUser(userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "User could not be deleted" },
        { status: 404 },
      );
    }

    await logActivity({
      action: "user_delete",
      actorId: session.user.id ? parseInt(session.user.id, 10) : null,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetType: "user",
      targetId: String(deleted.id),
      targetName: deleted.email,
      details: {
        role: deleted.role,
        name: deleted.name,
        email: deleted.email,
      },
      request,
    });

    const counts = await getUserCounts(session.user.role);

    return NextResponse.json({
      success: true,
      deletedUser: {
        id: deleted.id,
        email: deleted.email,
        name: deleted.name,
        role: deleted.role,
      },
      counts,
    });
  } catch (error) {
    console.error("[API/Admin/Users DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete user account" },
      { status: 500 },
    );
  }
}

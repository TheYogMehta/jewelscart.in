import { auth } from "./index";
import { redirect } from "next/navigation";
import type { AppRole } from "./users";

import { isStaffOrAbove, canManageUsers, canViewLogs } from "./config";
export { canManageUsers, canViewLogs };

export function canCreateRole(
  actorRole: string | undefined,
  targetRole: string,
): boolean {
  if (actorRole === "developer") {
    return ["developer", "admin", "staff", "user"].includes(targetRole);
  }
  if (actorRole === "admin") {
    return ["staff", "user"].includes(targetRole);
  }
  return false;
}

export function canEditUserRole(
  actorRole: string | undefined,
  targetCurrentRole: string,
  newRole: string,
): boolean {
  if (targetCurrentRole === "developer") return false;

  if (newRole === "developer") return false;

  if (actorRole === "developer") {
    return ["admin", "staff", "user"].includes(newRole);
  }
  if (actorRole === "admin") {
    return ["staff", "user"].includes(newRole);
  }
  return false;
}

export function canDeleteUser(
  actorRole: string | undefined,
  targetRole: string,
): boolean {
  if (targetRole === "developer") return false;
  if (actorRole === "developer") {
    return ["admin", "staff", "user"].includes(targetRole);
  }
  if (actorRole === "admin") {
    return ["staff", "user"].includes(targetRole);
  }
  return false;
}

export function getAllowedRolesToCreate(
  actorRole: string | undefined,
): AppRole[] {
  if (actorRole === "developer") {
    return ["admin", "staff"];
  }
  if (actorRole === "admin") {
    return ["staff"];
  }
  return [];
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireDashboardAccess() {
  const session = await requireAuth();
  if (!isStaffOrAbove(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireUserManager() {
  const session = await requireAuth();
  if (!canManageUsers(session.user.role)) {
    redirect("/admin");
  }
  return session;
}

export async function requireLogsAccess() {
  const session = await requireAuth();
  if (!canViewLogs(session.user.role)) {
    redirect("/admin");
  }
  return session;
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user || !isStaffOrAbove(session.user.role)) {
    return null;
  }
  return session;
}

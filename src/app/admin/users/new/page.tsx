import Link from "next/link";
import { requireUserManager, getAllowedRolesToCreate } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";
import { CreateUserForm } from "./CreateUserForm";

export const metadata = buildMetadata({
  title: "Add or Assign User",
  description: "Provision new staff or admin user",
  path: "/admin/users/new",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const session = await requireUserManager();
  const actorRole = session.user.role;
  const allowedRoles = getAllowedRolesToCreate(actorRole);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <Link href="/admin/users" className="hover:text-stone-900 transition">
          Users
        </Link>
        <span>/</span>
        <span className="text-stone-800">Add or Assign</span>
      </nav>

      <div>
        <h1 className="font-display text-3xl font-semibold text-stone-900">
          Add or Assign Team Member
        </h1>
      </div>

      <CreateUserForm
        actorRole={actorRole}
        allowedRoles={allowedRoles}
        currentUserEmail={session.user.email}
      />
    </div>
  );
}

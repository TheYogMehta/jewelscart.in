import Link from "next/link";
import { requireUserManager } from "@/lib/auth/rbac";
import { listUsers, getUserCounts } from "@/lib/auth/users";
import { buildMetadata } from "@/lib/seo";
import { UserList } from "./UserList";

export const metadata = buildMetadata({
  title: "User Management",
  description: "Manage accounts and permissions",
  path: "/admin/users",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireUserManager();
  const actorRole = session.user.role;
  const [userResult, counts] = await Promise.all([
    listUsers(actorRole, "team", 1, 12),
    getUserCounts(actorRole),
  ]);

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            View registered users and provision accounts according to your
            administrative permissions.
          </p>
        </div>

        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-light transition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add or Assign User
        </Link>
      </div>

      {/* Users Section */}
      <UserList
        initialUsers={userResult.users}
        initialPagination={{
          page: userResult.page,
          pageSize: userResult.pageSize,
          total: userResult.total,
          totalPages: userResult.totalPages,
        }}
        initialCounts={counts}
        actorRole={actorRole}
        currentUserEmail={session.user.email}
        currentUserId={session.user.id}
      />
    </div>
  );
}

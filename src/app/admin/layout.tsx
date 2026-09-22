import { canManageUsers, canViewLogs } from "@/lib/auth/config";
import { requireDashboardAccess } from "@/lib/auth/rbac";
import { AdminNavbar } from "./AdminNavbar";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Dashboard",
  description: "Management Portal",
  path: "/admin",
  noIndex: true,
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardAccess();
  const showUserMgmt = canManageUsers(session.user.role);
  const showLogs = canViewLogs(session.user.role);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-stone-50 pb-16 print:bg-white print:p-0 print:pb-0">
      <div className="print:hidden">
        <AdminNavbar
          canManageUsers={showUserMgmt}
          canViewLogs={showLogs}
          userEmail={session.user.email}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pt-6 sm:px-6 lg:px-8 print:p-0 print:max-w-none">
        {children}
      </div>
    </div>
  );
}

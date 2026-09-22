import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getAnalyticsOverview } from "@/lib/analytics";
import { AdminDashboard } from "./AdminDashboard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Dashboard & Analytics",
  description:
    "Sales performance, traffic, hotspots, and customer intelligence",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireDashboardAccess();
  const overview = await getAnalyticsOverview(14);
  const displayName = session.user.name || session.user.email || "";

  return <AdminDashboard overview={overview} userName={displayName} />;
}

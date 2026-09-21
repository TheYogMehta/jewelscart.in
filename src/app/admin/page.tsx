import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getAnalyticsOverview } from "@/lib/analytics";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Analytics & Overview",
  description: "Traffic, hotspots, and customer intelligence",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireDashboardAccess();
  const overview = await getAnalyticsOverview(14);
  const displayName = session.user.name || session.user.email || "";

  return <AnalyticsDashboard overview={overview} userName={displayName} />;
}

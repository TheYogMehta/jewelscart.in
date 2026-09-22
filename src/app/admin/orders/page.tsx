import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getOrderStatusCounts, getSalesOverview } from "@/lib/orders/stats";
import { listOrders } from "@/lib/orders";
import { buildMetadata } from "@/lib/seo";
import OrdersDashboard from "./OrdersDashboard";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Orders",
  description: "Manage customer orders, view status, and track fulfillments",
  path: "/admin/orders",
  noIndex: true,
});

export default async function AdminOrdersPage() {
  await requireDashboardAccess();

  const [statusCounts, initialOrdersData, salesOverview] = await Promise.all([
    getOrderStatusCounts(),
    listOrders({ page: 1, pageSize: 20 }),
    getSalesOverview(30),
  ]);

  const statusCountsArray = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  return (
    <OrdersDashboard
      initialStatusCounts={statusCountsArray}
      initialOrders={initialOrdersData.orders}
      initialTotalPages={initialOrdersData.totalPages}
      initialOverview={salesOverview}
    />
  );
}

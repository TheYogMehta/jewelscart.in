import { notFound } from "next/navigation";
import { requireDashboardAccess } from "@/lib/auth/rbac";
import { getOrderById } from "@/lib/orders";
import OrderDetail from "./OrderDetail";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return buildMetadata({
    title: `Order #${resolvedParams.id} | Admin Dashboard | JewelsCart`,
    description: "Order management and details",
    noIndex: true,
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess();

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetail order={order} />;
}

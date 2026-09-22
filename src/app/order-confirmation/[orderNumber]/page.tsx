import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/orders";
import { buildMetadata } from "@/lib/seo";
import OrderConfirmationView from "./OrderConfirmationView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return buildMetadata({
    title: `Order Confirmed #${orderNumber} | JewelsCart`,
    description: `Thank you for your order with JewelsCart. View your purchase receipt and details.`,
    noIndex: true,
  });
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/");
  }

  const { orderNumber } = await params;

  if (!orderNumber) {
    notFound();
  }

  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    notFound();
  }

  const sessionUserId = session.user.id
    ? parseInt(String(session.user.id), 10)
    : null;
  const sessionEmail = session.user.email?.toLowerCase();

  const ownsOrder =
    (sessionUserId && order.userId === sessionUserId) ||
    (sessionEmail && order.userEmail?.toLowerCase() === sessionEmail);

  if (!ownsOrder) {
    notFound();
  }

  return (
    <main className="w-full">
      <OrderConfirmationView order={order} />
    </main>
  );
}

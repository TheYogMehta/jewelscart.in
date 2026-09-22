import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/rbac";
import {
  getSalesOverview,
  getMonthlySalesStats,
  getOrderStatusCounts,
} from "@/lib/orders/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const months = parseInt(searchParams.get("months") || "6");

    const [overview, monthlyStats, statusCounts] = await Promise.all([
      getSalesOverview(days),
      getMonthlySalesStats(months),
      getOrderStatusCounts(),
    ]);

    return NextResponse.json({
      overview,
      monthlyStats,
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

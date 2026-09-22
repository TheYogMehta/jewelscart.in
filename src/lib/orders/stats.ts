import { connectDB } from "@/lib/db";

export async function getSalesOverview(days: number) {
  const db = await connectDB();

  const totalRes = await db.query(
    `SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM orders
    WHERE created_at >= NOW() - make_interval(days => $1)
      AND status != 'cancelled'`,
    [days],
  );

  const todayRes = await db.query(
    `SELECT
      COUNT(*) as orders_today,
      COALESCE(SUM(total_amount), 0) as revenue_today
    FROM orders
    WHERE created_at >= CURRENT_DATE
      AND status != 'cancelled'`,
  );

  return {
    totalOrders: parseInt(totalRes.rows[0]?.total_orders || "0", 10),
    totalRevenue: parseFloat(totalRes.rows[0]?.total_revenue || "0"),
    avgOrderValue: parseFloat(totalRes.rows[0]?.avg_order_value || "0"),
    ordersToday: parseInt(todayRes.rows[0]?.orders_today || "0", 10),
    revenueToday: parseFloat(todayRes.rows[0]?.revenue_today || "0"),
  };
}

export async function getMonthlySalesStats(months: number) {
  const db = await connectDB();

  const res = await db.query(
    `WITH months_series AS (
      SELECT generate_series(
        date_trunc('month', NOW() - make_interval(months => $1 - 1)),
        date_trunc('month', NOW()),
        '1 month'::INTERVAL
      ) AS m
    )
    SELECT
      TO_CHAR(ms.m, 'YYYY-MM') as month,
      TO_CHAR(ms.m, 'Mon YY') as label,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_value
    FROM months_series ms
    LEFT JOIN orders o
      ON date_trunc('month', o.created_at) = ms.m
      AND o.status != 'cancelled'
    GROUP BY ms.m
    ORDER BY ms.m ASC`,
    [months],
  );

  return res.rows.map((row: Record<string, string>) => ({
    month: row.month,
    label: row.label,
    orderCount: parseInt(row.order_count, 10),
    revenue: parseFloat(row.revenue || "0"),
    avgValue: parseFloat(row.avg_value || "0"),
  }));
}

export async function getOrderStatusCounts(): Promise<Record<string, number>> {
  const db = await connectDB();

  const res = await db.query(
    `SELECT status, COUNT(*) as count FROM orders GROUP BY status`,
  );

  const counts: Record<string, number> = {};
  for (const row of res.rows) {
    counts[row.status] = parseInt(row.count, 10);
  }

  return counts;
}

export async function getRecentOrders(limit: number) {
  const db = await connectDB();

  const res = await db.query(
    `SELECT id, order_number, user_email, user_name, status, total_amount, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT $1`,
    [limit],
  );

  return res.rows.map((row: Record<string, string>) => ({
    id: parseInt(row.id),
    orderNumber: row.order_number,
    userEmail: row.user_email,
    userName: row.user_name,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    createdAt: new Date(row.created_at),
  }));
}

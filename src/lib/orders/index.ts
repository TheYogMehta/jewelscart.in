import { connectDB } from "@/lib/db";

import { type Order, type OrderItem, type OrderStatus } from "./types";
export * from "./types";

function mapOrderItemToCamelCase(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    productImage: row.product_image,
    productSku: row.product_sku,
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    totalPrice: parseFloat(row.total_price),
  };
}

export async function ensureDbSchema() {
  // Schema updated directly on database
}

function mapOrderToCamelCase(row: any, items?: OrderItem[]): Order {
  const order: Order = {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    status: row.status as OrderStatus,
    subtotal: parseFloat(row.subtotal),
    shippingFee: parseFloat(row.shipping_fee),
    totalAmount: parseFloat(row.total_amount),
    shippingAddress: row.shipping_address,
    paymentId: row.payment_id,
    paymentOrderId: row.payment_order_id,
    paymentSignature: row.payment_signature,
    paymentMethod: row.payment_method,
    trackingId: row.tracking_id,
    trackingUrl: row.tracking_url,
    trackingCourier: row.tracking_courier,
    adminNotes: row.admin_notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
  if (items) {
    order.items = items;
  }
  return order;
}

export async function generateOrderNumber(): Promise<string> {
  const db = await connectDB();
  const res = await db.query("SELECT MAX(id) FROM orders");
  const maxId = res.rows[0]?.max || 0;
  const nextId = maxId + 1;
  return `JC-ORD-${nextId.toString().padStart(5, "0")}`;
}

export async function createOrder(data: {
  userId?: number;
  userEmail?: string;
  userName?: string;
  items: {
    productId: number;
    productName: string;
    productSlug: string;
    productImage: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: any;
  paymentId?: string;
  paymentOrderId?: string;
  paymentSignature?: string;
  paymentMethod?: string;
}): Promise<Order> {
  const db = await connectDB();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const orderNumber = await generateOrderNumber();

    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, user_id, user_email, user_name, status, subtotal, 
        shipping_fee, total_amount, shipping_address, payment_id, 
        payment_order_id, payment_signature, payment_method, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) 
      RETURNING *`,
      [
        orderNumber,
        data.userId || null,
        data.userEmail || null,
        data.userName || null,
        "pending",
        data.subtotal,
        data.shippingFee,
        data.totalAmount,
        data.shippingAddress,
        data.paymentId || null,
        data.paymentOrderId || null,
        data.paymentSignature || null,
        data.paymentMethod || null,
      ],
    );

    const orderRow = orderRes.rows[0];
    const orderItems: OrderItem[] = [];

    for (const item of data.items) {
      const totalPrice = item.quantity * item.unitPrice;
      const itemRes = await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_slug, product_image, 
          product_sku, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          orderRow.id,
          item.productId,
          item.productName,
          item.productSlug,
          item.productImage,
          item.productSku,
          item.quantity,
          item.unitPrice,
          totalPrice,
        ],
      );

      orderItems.push(mapOrderItemToCamelCase(itemRes.rows[0]));

      await client.query(
        `UPDATE products 
         SET qty = GREATEST(0, qty - $1), 
             stock_status = CASE WHEN qty - $1 <= 0 THEN 'out_of_stock' ELSE stock_status END,
             updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.productId],
      );
    }

    await client.query("COMMIT");
    return mapOrderToCamelCase(orderRow, orderItems);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderById(id: number): Promise<Order | null> {
  await ensureDbSchema();
  const db = await connectDB();
  const res = await db.query("SELECT * FROM orders WHERE id = $1", [id]);

  if (res.rows.length === 0) return null;

  const itemsRes = await db.query(
    "SELECT * FROM order_items WHERE order_id = $1",
    [id],
  );
  return mapOrderToCamelCase(
    res.rows[0],
    itemsRes.rows.map(mapOrderItemToCamelCase),
  );
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  const db = await connectDB();
  const res = await db.query("SELECT * FROM orders WHERE order_number = $1", [
    orderNumber,
  ]);

  if (res.rows.length === 0) return null;

  const id = res.rows[0].id;
  const itemsRes = await db.query(
    "SELECT * FROM order_items WHERE order_id = $1",
    [id],
  );
  return mapOrderToCamelCase(
    res.rows[0],
    itemsRes.rows.map(mapOrderItemToCamelCase),
  );
}

export async function listOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const db = await connectDB();

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  let conditions: string[] = [];
  let values: any[] = [];
  let paramCounter = 1;

  if (options?.status) {
    conditions.push(`status = $${paramCounter}`);
    values.push(options.status);
    paramCounter++;
  }

  if (options?.search) {
    conditions.push(
      `(order_number ILIKE $${paramCounter} OR user_email ILIKE $${paramCounter} OR user_name ILIKE $${paramCounter})`,
    );
    values.push(`%${options.search}%`);
    paramCounter++;
  }

  if (options?.dateFrom) {
    conditions.push(`created_at >= $${paramCounter}`);
    values.push(options.dateFrom);
    paramCounter++;
  }

  if (options?.dateTo) {
    conditions.push(`created_at <= $${paramCounter}`);
    values.push(options.dateTo);
    paramCounter++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
  const countRes = await db.query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT * FROM orders 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
  `;

  const ordersRes = await db.query(query, [...values, pageSize, offset]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    orders: ordersRes.rows.map((row: any) => mapOrderToCamelCase(row)),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function updateOrderStatus(
  id: number,
  status: string,
  adminNotes?: string,
): Promise<Order> {
  const db = await connectDB();

  let query = "";
  let values: any[] = [];

  if (adminNotes !== undefined) {
    query = `UPDATE orders SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`;
    values = [status, adminNotes, id];
  } else {
    query = `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    values = [status, id];
  }

  const res = await db.query(query, values);
  return mapOrderToCamelCase(res.rows[0]);
}

export async function setOrderTracking(
  id: number,
  data: { trackingId: string; trackingUrl?: string; courier?: string },
): Promise<Order> {
  const db = await connectDB();
  const res = await db.query(
    `UPDATE orders SET tracking_id = $1, tracking_url = $2, tracking_courier = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
    [data.trackingId, data.trackingUrl || null, data.courier || null, id],
  );
  return mapOrderToCamelCase(res.rows[0]);
}



export async function getOrdersByUserId(
  userId: number,
  userEmail?: string,
): Promise<Order[]> {
  const db = await connectDB();
  const query = userEmail
    ? `SELECT * FROM orders WHERE user_id = $1 OR user_email = $2 ORDER BY created_at DESC`
    : `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`;
  const params = userEmail ? [userId, userEmail] : [userId];
  const ordersRes = await db.query(query, params);

  if (ordersRes.rows.length === 0) return [];

  const orderIds = ordersRes.rows.map((r: { id: number }) => r.id);
  const itemsRes = await db.query(
    `SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id ASC`,
    [orderIds],
  );

  const itemsByOrderId: Record<number, OrderItem[]> = {};
  for (const itemRow of itemsRes.rows) {
    const item = mapOrderItemToCamelCase(itemRow);
    if (!itemsByOrderId[item.orderId]) {
      itemsByOrderId[item.orderId] = [];
    }
    itemsByOrderId[item.orderId].push(item);
  }

  return ordersRes.rows.map((row: any) =>
    mapOrderToCamelCase(row, itemsByOrderId[row.id] || []),
  );
}

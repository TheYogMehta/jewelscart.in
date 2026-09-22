import { connectDB } from "@/lib/db";

export const RESERVATION_TTL_MINUTES = 10;

export async function releaseExpiredReservations(): Promise<number> {
  const db = await connectDB();
  const res = await db.query(
    "DELETE FROM cart_reservations WHERE expires_at < NOW()",
  );
  return res.rowCount ?? 0;
}

export async function reserveCartItems(
  sessionId: string,
  userId: number,
  items: { productId: number; quantity: number }[],
): Promise<{
  success: boolean;
  items: {
    productId: number;
    requested: number;
    available: number;
    reserved: boolean;
  }[];
  sessionId: string;
  expiresAt: string;
}> {
  if (!userId || typeof userId !== "number" || userId <= 0) {
    throw new Error(
      "Only authenticated members with a valid userId can reserve cart items",
    );
  }

  await releaseExpiredReservations();

  const db = await connectDB();
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60000);
  const resultItems = [];
  let allReserved = true;

  for (const item of items) {
    const productRes = await db.query(
      "SELECT qty FROM products WHERE id = $1",
      [item.productId],
    );

    if (productRes.rowCount === 0 || productRes.rows[0].qty === null) {
      resultItems.push({
        productId: item.productId,
        requested: item.quantity,
        available: 0,
        reserved: false,
      });
      allReserved = false;
      continue;
    }

    const productQty = productRes.rows[0].qty;

    const reservationsRes = await db.query(
      `SELECT SUM(quantity) as reserved_qty 
       FROM cart_reservations 
       WHERE product_id = $1 AND session_id != $2 AND expires_at > NOW()`,
      [item.productId, sessionId],
    );

    const reservedQty = parseInt(
      reservationsRes.rows[0].reserved_qty || "0",
      10,
    );
    const availableQty = productQty - reservedQty;

    if (availableQty >= item.quantity) {
      await db.query(
        `INSERT INTO cart_reservations (session_id, user_id, product_id, quantity, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (session_id, product_id) 
         DO UPDATE SET quantity = EXCLUDED.quantity, expires_at = EXCLUDED.expires_at, user_id = EXCLUDED.user_id`,
        [sessionId, userId, item.productId, item.quantity, expiresAt],
      );
      resultItems.push({
        productId: item.productId,
        requested: item.quantity,
        available: availableQty,
        reserved: true,
      });
    } else {
      resultItems.push({
        productId: item.productId,
        requested: item.quantity,
        available: availableQty,
        reserved: false,
      });
      allReserved = false;
    }
  }

  return {
    success: allReserved,
    items: resultItems,
    sessionId,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function releaseReservation(sessionId: string): Promise<number> {
  const db = await connectDB();
  const res = await db.query(
    "DELETE FROM cart_reservations WHERE session_id = $1",
    [sessionId],
  );
  return res.rowCount ?? 0;
}

export async function releaseReservationForUser(
  sessionId: string,
  userId: number,
): Promise<number> {
  const db = await connectDB();
  const res = await db.query(
    "DELETE FROM cart_reservations WHERE session_id = $1 AND user_id = $2",
    [sessionId, userId],
  );
  return res.rowCount ?? 0;
}

export async function releaseReservationForProduct(
  sessionId: string,
  productId: number,
): Promise<number> {
  const db = await connectDB();
  const res = await db.query(
    "DELETE FROM cart_reservations WHERE session_id = $1 AND product_id = $2",
    [sessionId, productId],
  );
  return res.rowCount ?? 0;
}

export async function getActiveReservations(
  sessionId: string,
): Promise<{ productId: number; quantity: number; expiresAt: Date }[]> {
  const db = await connectDB();
  const res = await db.query(
    `SELECT product_id, quantity, expires_at 
     FROM cart_reservations 
     WHERE session_id = $1 AND expires_at > NOW()`,
    [sessionId],
  );

  return res.rows.map((row) => ({
    productId: row.product_id,
    quantity: row.quantity,
    expiresAt: row.expires_at,
  }));
}

export async function getAvailableStock(productId: number): Promise<number> {
  await releaseExpiredReservations();

  const db = await connectDB();
  const productRes = await db.query("SELECT qty FROM products WHERE id = $1", [
    productId,
  ]);

  if (productRes.rowCount === 0 || productRes.rows[0].qty === null) {
    return 0;
  }

  const productQty = productRes.rows[0].qty;

  const reservationsRes = await db.query(
    `SELECT SUM(quantity) as reserved_qty 
     FROM cart_reservations 
     WHERE product_id = $1 AND expires_at > NOW()`,
    [productId],
  );

  const reservedQty = parseInt(reservationsRes.rows[0].reserved_qty || "0", 10);
  return Math.max(0, productQty - reservedQty);
}

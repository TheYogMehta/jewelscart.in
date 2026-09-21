import { z } from "zod";
import { connectDB } from "@/lib/db";

export const addressSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number cannot exceed 20 characters"),
  address_line1: z
    .string()
    .trim()
    .min(3, "Address line 1 must be at least 3 characters")
    .max(300, "Address line 1 cannot exceed 300 characters"),
  address_line2: z.string().trim().max(300).optional().nullable(),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters"),
  state: z
    .string()
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(100, "State cannot exceed 100 characters"),
  postal_code: z
    .string()
    .trim()
    .min(3, "Postal code is too short")
    .max(20, "Postal code cannot exceed 20 characters"),
  country: z.string().trim().max(100).optional().default(""),
  is_default: z.boolean().optional().default(false),
  address_type: z.enum(["home", "work", "other"]).default("home"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export interface AddressRecord {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  address_type: "home" | "work" | "other";
  created_at: Date;
  updated_at: Date;
}

export async function getAddressesByUserId(
  userId: number,
): Promise<AddressRecord[]> {
  const pool = await connectDB();
  const res = await pool.query(
    `SELECT * FROM addresses 
     WHERE user_id = $1 
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return res.rows;
}

export async function getAddressById(
  addressId: number,
  userId: number,
): Promise<AddressRecord | null> {
  const pool = await connectDB();
  const res = await pool.query(
    `SELECT * FROM addresses 
     WHERE id = $1 AND user_id = $2 
     LIMIT 1`,
    [addressId, userId],
  );
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function createAddress(
  userId: number,
  data: AddressInput,
): Promise<AddressRecord> {
  const pool = await connectDB();

  const countRes = await pool.query(
    `SELECT COUNT(*) AS count FROM addresses WHERE user_id = $1`,
    [userId],
  );
  const addressCount = parseInt(countRes.rows[0]?.count ?? "0", 10);
  const shouldBeDefault = addressCount === 0 || Boolean(data.is_default);

  if (shouldBeDefault) {
    await pool.query(
      `UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1`,
      [userId],
    );
  }

  const res = await pool.query(
    `INSERT INTO addresses (
       user_id, full_name, phone, address_line1, address_line2, 
       city, state, postal_code, country, is_default, address_type
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      userId,
      data.full_name.trim(),
      data.phone.trim(),
      data.address_line1.trim(),
      data.address_line2?.trim() || null,
      data.city.trim(),
      data.state.trim(),
      data.postal_code.trim(),
      data.country?.trim() || "",
      shouldBeDefault,
      data.address_type || "home",
    ],
  );

  return res.rows[0];
}

export async function updateAddress(
  userId: number,
  addressId: number,
  data: AddressInput,
): Promise<AddressRecord> {
  const pool = await connectDB();

  if (data.is_default) {
    await pool.query(
      `UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1`,
      [userId],
    );
  }

  const res = await pool.query(
    `UPDATE addresses
     SET full_name = $1,
         phone = $2,
         address_line1 = $3,
         address_line2 = $4,
         city = $5,
         state = $6,
         postal_code = $7,
         country = $8,
         is_default = CASE WHEN $9 = TRUE THEN TRUE ELSE is_default END,
         address_type = $10,
         updated_at = NOW()
     WHERE id = $11 AND user_id = $12
     RETURNING *`,
    [
      data.full_name.trim(),
      data.phone.trim(),
      data.address_line1.trim(),
      data.address_line2?.trim() || null,
      data.city.trim(),
      data.state.trim(),
      data.postal_code.trim(),
      data.country?.trim() || "",
      Boolean(data.is_default),
      data.address_type || "home",
      addressId,
      userId,
    ],
  );

  if (res.rows.length === 0) {
    throw new Error("Address not found or unauthorized");
  }

  return res.rows[0];
}

export async function setDefaultAddress(
  userId: number,
  addressId: number,
): Promise<AddressRecord> {
  const pool = await connectDB();

  await pool.query(
    `UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1`,
    [userId],
  );

  const res = await pool.query(
    `UPDATE addresses SET is_default = TRUE, updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [addressId, userId],
  );

  if (res.rows.length === 0) {
    throw new Error("Address not found or unauthorized");
  }

  return res.rows[0];
}

export async function deleteAddress(
  userId: number,
  addressId: number,
): Promise<boolean> {
  const pool = await connectDB();

  const checkRes = await pool.query(
    `SELECT is_default FROM addresses WHERE id = $1 AND user_id = $2`,
    [addressId, userId],
  );

  if (checkRes.rows.length === 0) {
    return false;
  }

  const wasDefault = checkRes.rows[0].is_default;

  await pool.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [
    addressId,
    userId,
  ]);

  if (wasDefault) {
    await pool.query(
      `UPDATE addresses 
       SET is_default = TRUE, updated_at = NOW() 
       WHERE id = (
         SELECT id FROM addresses 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1
       )`,
      [userId],
    );
  }

  return true;
}

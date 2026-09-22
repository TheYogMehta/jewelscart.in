import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { resolveRoleFromEmail } from "./config";

export type AppRole = "developer" | "admin" | "staff" | "user";

export const ALLOWED_ROLES: AppRole[] = ["developer", "admin", "staff", "user"];

export interface UserRecord {
  id: number;
  name: string | null;
  email: string;
  password_hash: string | null;
  role: AppRole;
  provider: string;
  email_verified: boolean;
  verification_token?: string | null;
  verification_token_expires?: Date | null;
  reset_password_token?: string | null;
  reset_password_token_expires?: Date | null;
  created_at: Date;
  updated_at?: Date;
}

export interface SafeUser {
  id: number;
  name: string | null;
  email: string;
  role: AppRole;
  provider: string;
  email_verified: boolean;
  created_at: Date;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const pool = await connectDB();
  const res = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email.trim()],
  );
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const pool = await connectDB();
  const res = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [
    id,
  ]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

const userSessionCache = new Map<
  number,
  { user: UserRecord | null; expiresAt: number }
>();

export async function getActiveUserCached(
  userId: number,
  email?: string,
): Promise<UserRecord | null> {
  const now = Date.now();
  const cached = userSessionCache.get(userId);
  if (cached && now < cached.expiresAt) {
    return cached.user;
  }

  let user = await findUserById(userId);
  if (!user && email) {
    user = await findUserByEmail(email);
  }

  userSessionCache.set(userId, { user, expiresAt: now + 60_000 });
  return user;
}

export function invalidateUserSessionCache(userId: number) {
  userSessionCache.delete(userId);
}

export type UserTabFilter = "team" | "customer" | "all";

export interface PaginatedUsersResult {
  users: SafeUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listUsers(
  actorRole?: string,
  filter: UserTabFilter = "team",
  page: number = 1,
  pageSize: number = 12,
): Promise<PaginatedUsersResult> {
  const pool = await connectDB();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  const offset = (safePage - 1) * safePageSize;

  const conditions: string[] = [];
  if (filter === "team") {
    if (actorRole === "admin") {
      conditions.push("role IN ('admin', 'staff')");
    } else {
      conditions.push("role IN ('developer', 'admin', 'staff')");
    }
  } else if (filter === "customer") {
    conditions.push("role = 'user'");
  } else if (actorRole === "admin") {
    conditions.push("role != 'developer'");
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT id, name, email, role, provider, email_verified, created_at,
            COUNT(*) OVER() AS full_count
     FROM users 
     ${whereClause} 
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [safePageSize, offset],
  );

  const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
  const totalPages = Math.ceil(total / safePageSize);

  const users = res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AppRole,
    provider: row.provider,
    email_verified: row.email_verified,
    created_at: row.created_at,
  }));

  return {
    users,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function searchUsers(
  query: string,
  actorRole?: string,
  filter: UserTabFilter = "all",
  page: number = 1,
  pageSize: number = 12,
): Promise<PaginatedUsersResult> {
  const pool = await connectDB();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  const offset = (safePage - 1) * safePageSize;

  const trimmed = query.trim().toLowerCase();
  const q = `%${trimmed}%`;
  const emailCondition = trimmed.includes("@")
    ? "LOWER(email) LIKE $1"
    : "LOWER(SPLIT_PART(email, '@', 1)) LIKE $1";

  const conditions: string[] = [
    `(${emailCondition} OR LOWER(COALESCE(name, '')) LIKE $1)`,
  ];

  if (filter === "team") {
    if (actorRole === "admin") {
      conditions.push("role IN ('admin', 'staff')");
    } else {
      conditions.push("role IN ('developer', 'admin', 'staff')");
    }
  } else if (filter === "customer") {
    conditions.push("role = 'user'");
  } else if (actorRole === "admin") {
    conditions.push("role != 'developer'");
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const res = await pool.query(
    `SELECT id, name, email, role, provider, email_verified, created_at,
            COUNT(*) OVER() AS full_count
     FROM users 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [q, safePageSize, offset],
  );

  const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
  const totalPages = Math.ceil(total / safePageSize);

  const users = res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AppRole,
    provider: row.provider,
    email_verified: row.email_verified,
    created_at: row.created_at,
  }));

  return {
    users,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function deleteUser(userId: number): Promise<UserRecord | null> {
  invalidateUserSessionCache(userId);
  const pool = await connectDB();
  const res = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [
    userId,
  ]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function getUserCounts(actorRole?: string): Promise<{
  team: number;
  customer: number;
  total: number;
}> {
  const pool = await connectDB();
  const teamRoles =
    actorRole === "admin"
      ? "'admin', 'staff'"
      : "'developer', 'admin', 'staff'";

  const res = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE role IN (${teamRoles})) AS team_count,
      COUNT(*) FILTER (WHERE role = 'user') AS customer_count,
      COUNT(*) FILTER (WHERE ${actorRole === "admin" ? "role != 'developer'" : "1=1"}) AS total_count
    FROM users
  `);
  const row = res.rows[0];
  return {
    team: parseInt(row?.team_count ?? "0", 10),
    customer: parseInt(row?.customer_count ?? "0", 10),
    total: parseInt(row?.total_count ?? "0", 10),
  };
}

export async function updateUserRole(
  userId: number,
  role: AppRole,
): Promise<UserRecord> {
  invalidateUserSessionCache(userId);
  const pool = await connectDB();
  const res = await pool.query(
    `UPDATE users 
     SET role = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [role, userId],
  );
  if (res.rows.length === 0) {
    throw new Error("User not found");
  }
  return res.rows[0];
}

export async function updateUserProfile(
  userId: number,
  name: string,
): Promise<UserRecord> {
  invalidateUserSessionCache(userId);
  const pool = await connectDB();
  const res = await pool.query(
    `UPDATE users 
     SET name = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [name.trim(), userId],
  );
  if (res.rows.length === 0) {
    throw new Error("User not found");
  }
  return res.rows[0];
}

export async function countUsers(): Promise<number> {
  const pool = await connectDB();
  const res = await pool.query("SELECT COUNT(*) AS count FROM users");
  return parseInt(res.rows[0]?.count ?? "0", 10);
}

export async function createUser(data: {
  name?: string;
  email: string;
  password?: string;
  role?: AppRole;
  provider?: string;
  emailVerified?: boolean;
}): Promise<UserRecord> {
  const pool = await connectDB();
  const email = data.email.trim().toLowerCase();

  let role: AppRole;
  if (data.role && ALLOWED_ROLES.includes(data.role)) {
    role = data.role;
  } else {
    role = resolveRoleFromEmail(email);
  }

  const passwordHash = data.password ? hashPassword(data.password) : null;
  const provider = data.provider ?? "credentials";
  const emailVerified = data.emailVerified ?? provider === "google";

  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, provider, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name?.trim() || null,
      email,
      passwordHash,
      role,
      provider,
      emailVerified,
    ],
  );
  return res.rows[0];
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(userId: number): Promise<string> {
  const pool = await connectDB();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  await pool.query(
    `UPDATE users 
     SET verification_token = $1, 
         verification_token_expires = NOW() + INTERVAL '24 hours'
     WHERE id = $2`,
    [hashedToken, userId],
  );
  return rawToken;
}

export async function verifyUserToken(
  token: string,
): Promise<UserRecord | null> {
  if (!token) return null;
  const pool = await connectDB();
  const hashedToken = hashToken(token.trim());
  const res = await pool.query(
    `UPDATE users 
     SET email_verified = TRUE, 
         verification_token = NULL, 
         verification_token_expires = NULL,
         updated_at = NOW()
     WHERE verification_token = $1 
       AND verification_token_expires > NOW()
     RETURNING *`,
    [hashedToken],
  );
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function markUserVerified(userId: number): Promise<void> {
  const pool = await connectDB();
  await pool.query(
    `UPDATE users 
     SET email_verified = TRUE, 
         verification_token = NULL, 
         verification_token_expires = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

export async function setPasswordForUser(
  userId: number,
  password: string,
): Promise<UserRecord> {
  const pool = await connectDB();
  const passwordHash = hashPassword(password);
  const res = await pool.query(
    `UPDATE users 
     SET password_hash = $1, 
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [passwordHash, userId],
  );
  return res.rows[0];
}

export async function markGoogleLinked(userId: number): Promise<void> {
  const pool = await connectDB();
  await pool.query(
    `UPDATE users 
     SET google_linked = TRUE, 
         email_verified = TRUE, 
         updated_at = NOW() 
     WHERE id = $1`,
    [userId],
  );
}

export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string; user: UserRecord } | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const pool = await connectDB();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  const res = await pool.query(
    `UPDATE users 
     SET reset_password_token = $1, 
         reset_password_token_expires = NOW() + INTERVAL '1 hour',
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [hashedToken, user.id],
  );

  if (res.rows.length === 0) return null;
  return { token: rawToken, user: res.rows[0] };
}

export async function validatePasswordResetToken(
  token: string,
): Promise<UserRecord | null> {
  if (!token || !token.trim()) return null;
  const pool = await connectDB();
  const hashedToken = hashToken(token.trim());
  const res = await pool.query(
    `SELECT * FROM users 
     WHERE reset_password_token = $1 
       AND reset_password_token_expires > NOW()
     LIMIT 1`,
    [hashedToken],
  );
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<UserRecord | null> {
  if (!token || !token.trim()) return null;
  const pool = await connectDB();
  const passwordHash = hashPassword(newPassword);
  const hashedToken = hashToken(token.trim());

  const res = await pool.query(
    `UPDATE users 
     SET password_hash = $1, 
         reset_password_token = NULL, 
         reset_password_token_expires = NULL,
         email_verified = TRUE,
         updated_at = NOW()
     WHERE reset_password_token = $2 
       AND reset_password_token_expires > NOW()
     RETURNING *`,
    [passwordHash, hashedToken],
  );

  if (res.rows.length === 0) return null;
  invalidateUserSessionCache(res.rows[0].id);
  return res.rows[0];
}

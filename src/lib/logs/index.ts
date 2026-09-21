import { connectDB } from "@/lib/db";
import { extractClientIp, resolveLocationFromHeaders } from "@/lib/security/ip";

export interface ActivityLogEntry {
  id: number;
  action: string;
  actor_id?: number | null;
  actor_email?: string | null;
  actor_name?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  city?: string | null;
  country?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

export async function logActivity(data: {
  action: string;
  actorId?: number | null;
  actorEmail?: string | null;
  actorName?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  city?: string | null;
  country?: string | null;
  userAgent?: string | null;
  request?: Request;
}): Promise<void> {
  try {
    const pool = await connectDB();

    let ip = data.ip;
    let city = data.city;
    let country = data.country;
    let userAgent = data.userAgent;

    if (data.request) {
      const headers = data.request.headers;
      if (!ip) ip = extractClientIp(headers);
      if (!userAgent) userAgent = headers.get("user-agent") || undefined;
      if (!city || !country) {
        const loc = resolveLocationFromHeaders(headers);
        if (!city) city = loc.city;
        if (!country) country = loc.country;
      }
    }

    if (!city) city = "Anonymous";
    if (!country) country = "Anonymous";

    await pool.query(
      `INSERT INTO activity_logs 
        (action, actor_id, actor_email, actor_name, target_type, target_id, target_name, details, ip, city, country, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        data.action,
        data.actorId ?? null,
        data.actorEmail ?? null,
        data.actorName ?? null,
        data.targetType ?? null,
        data.targetId ?? null,
        data.targetName ?? null,
        data.details ? JSON.stringify(data.details) : null,
        ip ?? null,
        city,
        country,
        userAgent ?? null,
      ],
    );
  } catch (err) {
    console.error("[ActivityLog] Failed to log action:", data.action, err);
  }
}

const CATEGORY_ACTION_MAP: Record<string, string[]> = {
  content: ["hero_content_edit"],
  catalogue: [
    "product_create",
    "product_edit",
    "product_update",
    "product_delete",
    "category_create",
    "category_edit",
    "category_update",
    "category_delete",
  ],
  security: ["user_login", "password_change"],
  users: ["user_update", "user_delete", "password_change"],
};

export async function listActivityLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  category?: string;
  search?: string;
}): Promise<{ logs: ActivityLogEntry[]; total: number }> {
  const pool = await connectDB();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (options?.category && CATEGORY_ACTION_MAP[options.category]) {
    const actions = CATEGORY_ACTION_MAP[options.category];
    const placeholders = actions
      .map((_, i) => `$${values.length + i + 1}`)
      .join(", ");
    values.push(...actions);
    conditions.push(`action IN (${placeholders})`);
  } else if (options?.action) {
    values.push(options.action);
    conditions.push(`action = $${values.length}`);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    values.push(term);
    conditions.push(
      `(actor_name ILIKE $${values.length} OR actor_email ILIKE $${values.length} OR target_name ILIKE $${values.length})`,
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRes = await pool.query(
    `SELECT COUNT(*) AS count FROM activity_logs ${whereClause}`,
    values,
  );
  const total = parseInt(countRes.rows[0]?.count ?? "0", 10);

  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const res = await pool.query(
    `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values,
  );

  return {
    logs: res.rows.map((row) => ({
      id: row.id,
      action: row.action,
      actor_id: row.actor_id,
      actor_email: row.actor_email,
      actor_name: row.actor_name,
      target_type: row.target_type,
      target_id: row.target_id,
      target_name: row.target_name,
      details: row.details,
      ip: row.ip,
      city: row.city,
      country: row.country,
      user_agent: row.user_agent,
      created_at: row.created_at,
    })),
    total,
  };
}

export async function getActivityLogActions(): Promise<string[]> {
  try {
    const pool = await connectDB();
    const res = await pool.query(
      `SELECT DISTINCT action FROM activity_logs ORDER BY action ASC`,
    );
    return res.rows.map((row) => row.action as string);
  } catch (err) {
    console.error("[ActivityLog] Failed to fetch distinct actions:", err);
    return [];
  }
}

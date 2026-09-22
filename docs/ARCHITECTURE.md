# System Architecture

## Table of Contents

1. [Authentication & Session Flow (NextAuth v5)](#1-authentication--session-flow-nextauth-v5)
2. [Password Hashing & Cryptographic Security](#2-password-hashing--cryptographic-security)
3. [Rate Limiting & Anti-Abuse System](#3-rate-limiting--anti-abuse-system)
4. [Atomic Stock Reservation & Double-Order Prevention](#4-atomic-stock-reservation--double-order-prevention)
5. [Database Concurrency & Advisory Locks](#5-database-concurrency--advisory-locks)
6. [PostgreSQL Connection Management](#6-postgresql-connection-management)
7. [Database Migration Engine](#7-database-migration-engine)
8. [Media Optimization Pipeline (Sharp & FFmpeg)](#8-media-optimization-pipeline-sharp--ffmpeg)
9. [Next.js App Router Mechanics Explained](#9-nextjs-app-router-mechanics-explained)
10. [Role-Based Access Control (RBAC)](#10-role-based-access-control-rbac)
11. [Analytics & Visitor Hotspots Tracking](#11-analytics--visitor-hotspots-tracking)

---

## 1. Authentication & Session Flow (NextAuth v5)

**NextAuth v5 (Auth.js beta)** configured with two primary identity providers:

1. **Google OAuth 2.0**: For 1-click passwordless social login.
2. **Credentials Provider**: Custom email + password authentication with scrypt hashing.

### How it works step-by-step:

```
[Client / Login Page]
        │
        ├── 1. POST /api/auth/callback/credentials (email, password)
        ▼
[NextAuth authorize() Callback]  (src/lib/auth/index.ts)
        │
        ├── 2. Query user by lowercased email in PostgreSQL
        ├── 3. Verify password via timing-safe scrypt comparison
        ├── 4. Check email verification (if NEKO_MAIL is enabled)
        ▼
[JWT Callback]  (src/lib/auth/config.ts)
        │
        ├── 5. Embed `sub` (user id), `role`, `provider`, and `isEmailVerified` into JWT
        ├── 6. Auto-assign role="developer" if email is in DEVELOPER_EMAILS
        ▼
[Session Callback]  (src/lib/auth/config.ts)
        │
        ├── 7. Expose safe user object (`id`, `role`, `email`, `isEmailVerified`) to client
        ▼
[Encrypted/Signed Cookie]
        └── Set `authjs.session-token` (HttpOnly, SameSite=Lax, Secure in production)
```

### Catch-All Route Gateway (`src/app/api/auth/[...nextauth]/route.ts`)

The `[...nextauth]` route acts as an HTTP router for Auth.js:

- Intercepts `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, `/api/auth/providers`, and OAuth callback URLs.
- Exports standard GET and POST handlers:
  ```ts
  import { handlers } from "@/lib/auth";
  export const { GET, POST } = handlers;
  ```

---

## 2. Password Hashing

Passwords are never stored in plaintext. Node.js native `crypto.scryptSync` with unique random salts:

### Implementation (`src/lib/auth/users.ts`)

```ts
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}
```

### Timing-Safe Verification (`src/lib/auth/users.ts`)

```ts
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
```

### Why this matters:

1. **Memory-hard function (scrypt)**: scrypt is designed specifically to resist hardware-accelerated attacks (ASICs / GPUs) by requiring a significant amount of RAM.
2. **`crypto.timingSafeEqual`**: Traditional string comparison (`===`) terminates at the first mismatching character. Attackers can measure response times down to nanoseconds to deduce password hashes character-by-character. Timing-safe equality executes in constant time, defeating timing analysis.

---

## 3. Rate Limiting

To defend against brute-force password guessing and inventory hoarding scripts

### In-Memory Sliding Window Buckets (`src/lib/security/rate-limit.ts`)

Each key tracks request counts within a specified millisecond window:

```ts
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
```

- A periodic cleanup sweeps expired buckets every 5 minutes to prevent memory leaks.
- Supports IP-level and composite identifier keys (e.g., `forgot-password:email:${email}`).

### Rate Limits by Route (`src/middleware.ts` & Route Handlers)

| Scope              | Key Pattern                      | Limit   | Window     | Purpose                              |
| :----------------- | :------------------------------- | :------ | :--------- | :----------------------------------- |
| **Auth**           | `auth:${ip}`                     | 20 reqs | 60 seconds | Brute-force credential protection    |
| **Checkout**       | `checkout:${ip}`                 | 5 reqs  | 60 seconds | Mitigates card testing & spam orders |
| **Cart Reserve**   | `cart-reserve:${ip}`             | 10 reqs | 60 seconds | Inventory exhaustion prevention      |
| **General API**    | `api:${ip}`                      | 60 reqs | 60 seconds | DoS / Scraper mitigation             |
| **Password Reset** | `forgot-password:email:${email}` | 3 reqs  | 15 minutes | Email bombing prevention             |

### Cloudflare Turnstile CAPTCHA

Integrated into checkout and registration to verify human visitors without disruptive image-selection puzzles.

---

## 4. Double-Order Prevention

High-demand drops can cause two users to simultaneously attempt purchasing the last piece of Product.

### Step 1: Pre-Checkout Reservation (`src/lib/cart/reservation.ts`)

When a customer proceeds to checkout:

1. **Authentication Requirement**: Only authenticated members (`session.user.id`) can initiate reservations and proceed to checkout. Guests clicking checkout in the bag drawer are redirected to `/login?callbackUrl=...` to authenticate first.
2. The server checks available inventory:
   $$\text{Available Stock} = \text{Product.qty} - \sum(\text{Active unexpired reservations for other sessions})$$
3. If stock is available, an entry is inserted into `cart_reservations` with a **10-minute TTL** (`RESERVATION_TTL_MINUTES = 10`):
   ```sql
   INSERT INTO cart_reservations (session_id, user_id, product_id, quantity, expires_at, created_at)
   VALUES ($1, $2, $3, $4, $5, NOW())
   ON CONFLICT (session_id, product_id)
   DO UPDATE SET quantity = EXCLUDED.quantity, expires_at = EXCLUDED.expires_at;
   ```
4. If checkout is abandoned or closed, the reservation automatically expires without permanently reducing catalog inventory.

### Step 2: Atomic Order Placement (`src/lib/orders/index.ts`)

When payment is confirmed, the order and inventory decrement happen inside a single PostgreSQL **transaction block**:

```ts
await client.query("BEGIN");
// 1. Insert order record
// 2. Insert order items
// 3. Atomically decrement stock
await client.query(
  `UPDATE products 
   SET qty = GREATEST(0, qty - $1), 
       stock_status = CASE WHEN qty - $1 <= 0 THEN 'out_of_stock' ELSE stock_status END,
       updated_at = NOW()
   WHERE id = $2`,
  [item.quantity, item.productId],
);
await client.query("COMMIT");
```

If any error occurs, `await client.query("ROLLBACK")` rolls back all changes, guaranteeing that no customer is charged for an item whose inventory could not be locked.

---

## 5. Database Migration Engine

Migrations are run using `node-pg-migrate`

```bash
tsx --env-file=.env node_modules/.bin/node-pg-migrate -d POSTGRES_URL --migration-filename-format index up
```

### Breakdown of the command:

1. `tsx --env-file=.env`: Loads `.env` environment variables natively into the Node process before invoking the CLI.
2. `node_modules/.bin/node-pg-migrate`: Executes the migration runner.
3. `-d POSTGRES_URL`: Specifies the connection string environment variable name.
4. `--migration-filename-format index`: Names migrations sequentially (e.g. `001_initial_schema.sql`, `002_add_password_reset_token.sql`).
5. `up`: Applies all pending migrations up to the latest revision.

---

## 7. Media Optimization

High-resolution jewellery images and product showcase videos require aggressive compression to maintain low Largest Contentful Paint (LCP) and high Core Web Vitals scores.

### Image Optimization Pipeline (`src/lib/uploads/index.ts`)

```ts
const compressedBuffer = await sharp(buffer)
  .rotate() // Auto-corrects EXIF phone orientation
  .resize(maxDimension, maxDimension, {
    // Resizes to max bounding box (e.g. 1600px)
    fit: "inside",
    withoutEnlargement: true,
  })
  .webp({
    quality: 85, // Optimal visual fidelity for fine jewelry
    effort: 6, // Maximum compression algorithm effort
    smartSubsample: true, // Preserves sharp jewelry edge contrast
  })
  .toBuffer();
```

### Video Optimization Pipeline

Videos are normalized to MP4 format using static `ffmpeg-static` binaries, compressing bitrate while maintaining HD clarity for mobile shopping.

---

## 8. Role-Based Access Control (RBAC)

four hierarchical access tiers (`src/lib/auth/rbac.ts` & `src/lib/auth/config.ts`):

```
developer > admin > staff > user
```

| Role          | Permissions                                                                                |
| :------------ | :----------------------------------------------------------------------------------------- |
| **Developer** | Full access to server logs, system settings, user role elevation, and database operations. |
| **Admin**     | Full access to catalog, orders, promotions, user management, and analytics.                |
| **Staff**     | Order status updates, tracking URL management, and inventory stock monitoring.             |
| **User**      | Storefront shopping, order history, address book, and personal profile.                    |

---

## 9. Analytics & Visitor Hotspots Tracking

- **Hotspots Tracking**: Captures most viewed URLs, average view duration, and visitor drop-off percentages.
- **Audience Split**: Differentiates authenticated members vs. anonymous shoppers.
- **Geographic & Device**: Derives client devices (Mobile / Tablet / Desktop) and IP geolocation for order heatmaps without third-party tracking pixels.

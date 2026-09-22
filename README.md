# JewelsCart

Full-stack jewellery e-commerce catalogue and management platform with real-time cart reservations, order tracking, Razorpay checkout, and an admin analytics backoffice.

## Stack

- **Next.js 15** (App Router, Server Components & Route Handlers)
- **React 19**
- **PostgreSQL** (Raw SQL queries with `pg` connection pool and `node-pg-migrate`)
- **NextAuth v5** (Google OAuth 2.0 & Credentials provider with scrypt password hashing)
- **Tailwind CSS v4**
- **Zustand** (Persistent cart state & reservation management)
- **Razorpay** (Server-side HMAC verification and checkout)
- **Recharts** (Admin sales and revenue analytics)
- **Sharp** (Image optimization, WebP conversion, and thumbnail generation)

## Documentation

[`docs/`](./docs) directory:

- 📘 **[Architecture](./docs/ARCHITECTURE.md)**
- **[API Reference](./docs/API.md)**

---

## Features

### Storefront & Catalogue

- **Product Hierarchy:** Multi-level categories (Category &rarr; Sub-category &rarr; Child category) with visibility controls.
- **Product Detail Pages:** Image gallery, stock status badges, SKU tagging, specifications, and breadcrumb navigation.
- **SEO Optimization:** Dynamic OpenGraph metadata, canonical URLs, and automated JSON-LD structured data.
- **Persistent Cart:** Client-side cart drawer with real-time subtotal and quantity controls.

### Cart Reservation & Checkout

- **Stock Reservation System:** Real-time stock locks created when items enter checkout to prevent overselling. Reservations auto-expire if checkout is abandoned.
- **Dynamic Shipping:** State-based shipping calculation with configurable thresholds.
- **Razorpay Integration:** Secure modal checkout with server-side signature verification.

### Orders & Receipts

- **Customer Account (`/account`):** Order history with live fulfillment status.
- **Printable Receipts:** Zero-margin `@page` print styles to strip browser URLs, titles, and headers/footers for clean physical invoices.
- **Transactional Emails:** Branded HTML order confirmations and shipping updates via Neko Mail.

### Admin Dashboard (`/admin`)

- **Sales Analytics:** Revenue metrics, order volume counters, and trend charts.
- **Order Management:** Filter and view orders, update status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`), and assign courier tracking IDs.
- **Product Catalogue:** Full CRUD with automated SKU generation and image processing.
- **Category Management:** Taxonomy tree management and visibility toggles.
- **User RBAC:** Manage user accounts with role permissions (`developer`, `admin`, `staff`, `user`).
- **Audit Logging:** System and administrative activity tracking.

### Security

- **Rate Limiting:** Sliding-window rate limiters on auth, checkout, and API routes.
- **Bot Protection:** Cloudflare Turnstile integration.
- **Access Control:** Middleware route guards based on user roles.

---

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

| Variable                         | Description                                          |
| :------------------------------- | :--------------------------------------------------- |
| `POSTGRES_URL`                   | PostgreSQL connection string                         |
| `AUTH_SECRET`                    | Secret key for NextAuth (`openssl rand -base64 32`)  |
| `AUTH_GOOGLE_ID`                 | Google OAuth Client ID                               |
| `AUTH_GOOGLE_SECRET`             | Google OAuth Client Secret                           |
| `DEVELOPER_EMAILS`               | Comma-separated Google emails granted developer role |
| `NEXT_PUBLIC_SITE_URL`           | Public site URL (e.g., `http://localhost:5697`)      |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`    | Razorpay Key ID                                      |
| `RAZORPAY_KEY_SECRET`            | Razorpay Secret Key                                  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key                        |
| `TURNSTILE_SECRET_KEY`           | Cloudflare Turnstile secret key                      |
| `NEKO_MAIL_URL`                  | Neko Mail API endpoint (optional)                    |
| `NEKO_MAIL_API_KEY`              | Neko Mail API key (optional)                         |
| `NEKO_MAIL_FROM`                 | Sender address for transactional emails (optional)   |

### 2. Database Migrations

Run database migrations:

```bash
npm run migrate
```

### 3. Install & Run

```bash
npm install
npm run dev
```

The application will start on `http://localhost:5697`.

---

## Database Migrations

Migrations are managed with `node-pg-migrate` under the `/migrations` folder:

| Migration                              | Description                                           |
| :------------------------------------- | :---------------------------------------------------- |
| `001_initial_schema.sql`               | Products, users, categories, media, and activity logs |
| `002_add_password_reset_token.sql`     | Password reset tokens and expiry                      |
| `003_add_is_visible_to_categories.sql` | Visibility toggles for categories and subcategories   |
| `004_orders_and_reservations.sql`      | Orders, order items, and cart stock reservations      |

---

| Route                               | Description                                        |
| :---------------------------------- | :------------------------------------------------- |
| `/`                                 | Home page                                          |
| `/products/[slug]`                  | Product details with JSON-LD schema                |
| `/category/[slug]`                  | Category catalogue view                            |
| `/account`                          | Customer profile, saved addresses, and past orders |
| `/order-confirmation/[orderNumber]` | Order receipt card and confirmation                |
| `/admin`                            | Consolidated executive dashboard & analytics       |
| `/admin/orders`                     | Order management, filtering, and status updates    |
| `/admin/orders/[id]`                | Order fulfilment, courier tracking, and invoice    |
| `/admin/products`                   | Product catalogue CRUD & variant management        |
| `/admin/categories`                 | Category tree & hierarchy management               |
| `/admin/users`                      | User roles, customer lookup, and permissions       |
| `/admin/content`                    | Hero banners and promotional media management      |
| `/admin/logs`                       | Security events and activity audit trail           |
| `/login`                            | Authentication (Google OAuth & Credentials)        |
| `/verify-email`                     | Email verification token confirmation              |

---

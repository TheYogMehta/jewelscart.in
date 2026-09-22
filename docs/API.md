# API Reference

This document provides a comprehensive reference of all internal REST endpoints, required headers, request payloads, query parameters, authorization levels, and response structures.

- **Base URL**: `/api/*`

---

## 1. Authentication

### `POST /api/auth/register`

Registers a new customer account using name, email, and password.

- **Access**: Public
- **Rate Limit**: 10 requests / hour per IP
- **Request Body**:
  ```json
  {
    "name": "Yog Mehta",
    "email": "yog@theyogmehta.online",
    "password": "SecurePassword123!",
    "turnstileToken": "0.X.turnstile-token-here"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Account created successfully. Please check your email to verify your account."
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "error": "Password must be at least 6 characters"
    }
    ```
  - `429 Too Many Requests`:
    ```json
    {
      "error": "Too many accounts created from this IP. Please try again later."
    }
    ```

---

### `POST /api/auth/forgot-password`

Generates a secure password reset token and dispatches an email.

- **Access**: Public
- **Rate Limit**: 5 per IP / 3 per email per 15 minutes
- **Request Body**:
  ```json
  {
    "email": "yog@theyogmehta.online",
    "turnstileToken": "<cloudflare captcha>"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "If that email exists in our system, a password reset link has been dispatched."
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "error": "Please provide a valid email address."
    }
    ```

---

### `GET /api/auth/reset-password`

Validates whether a reset token is active and has not expired.

- **Access**: Public
- **Rate Limit**: 30 requests / minute per IP
- **Query Parameters**:
  - `token` (string, required): The UUID token received in the email.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "valid": true,
      "email": "yog@theyogmehta.online"
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "valid": false,
      "error": "This password reset link is invalid or has expired. Please request a new one."
    }
    ```

---

### `POST /api/auth/reset-password`

Consumes the token to update the account's password.

- **Access**: Public
- **Rate Limit**: 10 requests / 15 minutes per IP
- **Request Body**:
  ```json
  {
    "token": "<token via email>",
    "password": "NewStrongPassword456!",
    "turnstileToken": "<cloudflare captcha>"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Password updated successfully. You may now log in with your new credentials."
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "error": "Invalid or expired reset token."
    }
    ```

---

## 2. Customer Account & Address Book

### `GET /api/account/addresses`

Lists all saved delivery addresses for the authenticated customer.

- **Access**: Authenticated Member Only
- **Responses**:
  - `200 OK`:
    ```json
    {
      "addresses": [
        {
          "id": 14,
          "user_id": 8,
          "full_name": "Yog Mehta",
          "phone": "9876543210",
          "address_line1": "Temp Address 1",
          "address_line2": "Temp Address 2",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postal_code": "<post code>",
          "country": "India",
          "address_type": "home",
          "is_default": true,
          "created_at": "<time-stamp>"
        }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Unauthorized" }
    ```

---

### `POST /api/account/addresses`

Adds a new delivery address to the customer's address book.

- **Access**: Authenticated Member Only
- **Request Body**:
  ```json
  {
    "full_name": "Yog Mehta",
    "phone": "9876543210",
    "address_line1": "Temp Address 1",
    "address_line2": "Temp Address 2",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "<post code>",
    "country": "India",
    "address_type": "home",
    "is_default": true
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "ok": true,
      "address": {
        "id": 15,
        "user_id": 8,
        "full_name": "Yog Mehta",
        "phone": "9876543210",
        "address_line1": "Temp Address 1",
        "address_line2": "Temp Address 2",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "<post code>",
        "country": "India",
        "address_type": "home",
        "is_default": true
      },
      "message": "Address saved successfully"
    }
    ```
  - `400 Bad Request`:
    ```json
    { "error": "Invalid PIN code for selected location" }
    ```

---

### `PUT /api/account/addresses/[id]`

Updates an existing address belonging to the authenticated user.

- **Access**: Authenticated Member Only
- **Request Body**: Same schema as `POST /api/account/addresses`.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "ok": true,
      "address": { "id": 14, "city": "Bengaluru", "is_default": true },
      "message": "Address updated successfully"
    }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Address not found" }
    ```

---

### `DELETE /api/account/addresses/[id]`

Deletes a saved address from the customer's profile.

- **Access**: Authenticated Member Only
- **Responses**:
  - `200 OK`:
    ```json
    {
      "ok": true,
      "message": "Address deleted successfully"
    }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Address not found" }
    ```

---

### `PATCH /api/account/addresses/[id]/default`

Sets a specific address as the primary default address.

- **Access**: Authenticated Member Only
- **Responses**:
  - `200 OK`:
    ```json
    {
      "ok": true,
      "address": { "id": 14, "is_default": true },
      "message": "Default address updated"
    }
    ```

---

### `GET /api/account/orders`

Retrieves past order receipts for the logged-in user.

- **Access**: Authenticated Member Only
- **Responses**:
  - `200 OK`:
    ```json
    {
      "orders": [
        {
          "id": 34,
          "orderNumber": "JC-ORD-00034",
          "status": "delivered",
          "subtotal": 14999.0,
          "shippingFee": 0.0,
          "totalAmount": 14999.0,
          "createdAt": "2026-09-15T08:22:15.000Z",
          "items": [
            {
              "id": 48,
              "productId": 12,
              "productName": "<PRODUCT>",
              "productSku": "<PRODUCT-SKU>",
              "productImage": "/uploads/products/<PRODUCT>.webp",
              "quantity": 1,
              "unitPrice": 14999.0,
              "totalPrice": 14999.0
            }
          ]
        }
      ]
    }
    ```

---

### `POST /api/account/password`

Updates the password for an authenticated member account.

- **Access**: Authenticated Member Only
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "password": "NewSecurePassword789!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "ok": true,
      "message": "Password updated successfully"
    }
    ```
  - `400 Bad Request`:
    ```json
    { "error": "Current password does not match" }
    ```

---

## 3. Cart & Inventory Reservation APIs

### `POST /api/cart/reserve`

Places a 10-minute temporary stock hold on products entering checkout.

- **Access**: Authenticated Member Only
- **Rate Limit**: 10 reqs / min per IP
- **Request Body**:
  ```json
  {
    "sessionId": "cs_1727011234_abc89ef",
    "items": [{ "productId": 12, "quantity": 1 }]
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "sessionId": "cs_1727011234_abc89ef",
      "expiresAt": "2026-09-22T19:10:00.000Z",
      "items": [
        {
          "productId": 12,
          "requested": 1,
          "available": 4,
          "reserved": true
        }
      ]
    }
    ```
  - `400 Bad Request`:
    ```json
    {
      "error": "Reservation failed",
      "details": {
        "success": false,
        "items": [
          {
            "productId": 12,
            "requested": 1,
            "available": 0,
            "reserved": false
          }
        ]
      }
    }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Unauthorized. Only registered members can reserve cart items." }
    ```

---

### `DELETE /api/cart/reserve`

Releases an active stock reservation when the customer abandons checkout or closes the cart.

- **Access**: Authenticated Member Only
- **Query Parameters**:
  - `sessionId` (string, required): Active reservation session ID.
- **Responses**:
  - `200 OK`:
    ```json
    { "success": true }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "error": "Unauthorized. Only registered members can manage reservations."
    }
    ```

---

## 4. Checkout & Payment APIs

### `POST /api/checkout`

Verifies inventory, calculates shipping rules, reserves stock, and creates a Razorpay payment order.

- **Access**: Authenticated Member Only
- **Rate Limit**: 5 reqs / min per IP
- **Request Body**:
  ```json
  {
    "sessionId": "cs_1727011234_abc89ef",
    "items": [
      {
        "productId": "12",
        "name": "<PRODUCT>",
        "slug": "<PRODUCT-SLUG>",
        "image": "/uploads/products/<PRODUCT>.webp",
        "sku": "<PRODUCT-SKU>",
        "price": 14999,
        "quantity": 1
      }
    ],
    "deliveryAddress": {
      "fullName": "Yog Mehta",
      "phone": "9876543210",
      "addressLine1": "Address",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "<pin_code>"
    }
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "orderId": "order_NXK82kd92jd01",
      "amount": 1499900,
      "currency": "INR",
      "keyId": "rzp_live_xxxxxxxx",
      "expiresAt": "2026-09-22T19:10:00.000Z"
    }
    ```
  - `400 Bad Request`:
    ```json
    { "error": "Some items could not be reserved" }
    ```
  - `401 Unauthorized`:
    ```json
    { "error": "Unauthorized. Members only." }
    ```

---

### `POST /api/checkout/verify`

Performs cryptographic HMAC-SHA256 signature verification on Razorpay transaction callbacks, commits the order atomically inside a database transaction, decrements product stock, and triggers confirmation emails.

- **Access**: Authenticated Member Only
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_NXK82kd92jd01",
    "razorpay_payment_id": "pay_NXK87df1034d",
    "razorpay_signature": "4a51e6005...hmac-sha256-hex-digest",
    "sessionId": "cs_1727011234_abc89ef",
    "items": [
      {
        "productId": 12,
        "quantity": 1,
        "price": 14999
      }
    ],
    "deliveryAddress": {
      "fullName": "Yog Mehta",
      "phone": "9876543210",
      "addressLine1": "Address",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "<pin_code>"
    }
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "orderNumber": "JC-ORD-00042",
      "orderId": 42
    }
    ```
  - `400 Bad Request`:
    ```json
    { "error": "Invalid payment signature" }
    ```

---

## 5. Products & Catalog APIs

### `GET /api/products`

Retrieves products list with category, availability, and SKU search filters.

- **Access**: Staff / Admin / Developer
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "_id": 12,
        "name": "<PRODUCT>",
        "slug": "<PRODUCT-SLUG>",
        "category": "<PRODUCT-category>",
        "sub_category": "<PRODUCT-SubCategory>",
        "sku": "<PRODUCT-SKU>",
        "price": 14999.0,
        "qty": 5,
        "stock_status": "in_stock",
        "media": [
          { "url": "/uploads/products/<PRODUCT>.webp", "type": "image" }
        ],
        "created_at": "2026-09-01T12:00:00.000Z"
      }
    ]
    ```

---

### `POST /api/products`

Creates a new product with variant attributes and multipart media uploads.

- **Access**: Staff / Admin / Developer
- **Request Format**: `multipart/form-data`
  - `name`: `18K Gold Solitaire Ring`
  - `category`: `Rings`
  - `sub_category`: `Diamond Rings`
  - `price`: `14999`
  - `qty`: `5`
  - `sku`: `JC-SKU-00012`
  - `stock_status`: `in_stock`
  - `media`: File[] (Images/Videos)
- **Responses**:
  - `201 Created`:
    ```json
    {
      "_id": 12,
      "name": "<PRODUCT>",
      "slug": "<PRODUCT-slug>",
      "sku": "JC-SKU-00012",
      "price": 14999,
      "qty": 5,
      "stock_status": "in_stock"
    }
    ```
  - `400 Bad Request`:
    ```json
    { "error": "Unsupported image format. Allowed: JPEG, PNG, WebP, GIF." }
    ```

---

### `GET /api/products/[id]`

Fetches details of a specific product by ID.

- **Access**: Staff / Admin / Developer
- **Responses**:
  - `200 OK`:
    ```json
    {
      "_id": 12,
      "name": "<PRODUCT>",
      "price": 14999.0,
      "qty": 5,
      "stock_status": "in_stock",
      "media": [{ "url": "/uploads/products/<PRODUCT>.webp", "type": "image" }]
    }
    ```
  - `404 Not Found`:
    ```json
    { "error": "Not found" }
    ```

---

### `PATCH /api/products/[id]`

Updates product properties, pricing, stock levels, or replaces media.

- **Access**: Staff / Admin / Developer
- **Request Format**: `multipart/form-data` or `application/json`
  ```json
  {
    "price": 13999,
    "qty": 8,
    "stock_status": "in_stock"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "_id": 12,
      "name": "<PRODUCT>",
      "price": 13999,
      "qty": 8
    }
    ```

---

### `DELETE /api/products/[id]`

Permanently removes a product from the catalog.

- **Access**: Admin / Developer Only
- **Responses**:
  - `200 OK`:
    ```json
    { "success": true }
    ```

---

### `GET /api/products/next-sku`

Calculates and returns the next sequential inventory SKU.

- **Access**: Staff / Admin / Developer
- **Responses**:
  - `200 OK`:
    ```json
    { "nextSku": "JC-SKU-00043" }
    ```

---

## 6. Categories Management APIs

### `GET /api/categories`

Retrieves category tree hierarchy.

- **Access**: Public
- **Query Parameters**:
  - `visibleOnly` (boolean, optional): Filter only published categories.
  - `paths` (boolean, optional): Return flat URL path list.
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": 1,
        "name": "<CATEGORY>",
        "slug": "<CATEGORY-SLUG>",
        "parent_id": null,
        "is_visible": true,
        "header_order": 1,
        "children": [
          {
            "id": 5,
            "name": "<SUB-CATEGORY>",
            "slug": "<SUB-CATEGORY-SLUG>",
            "parent_id": 1,
            "is_visible": true
          }
        ]
      }
    ]
    ```

---

### `POST /api/categories`

Creates a new category node in the catalog.

- **Access**: Staff / Admin / Developer
- **Request Body**:
  ```json
  {
    "name": "<CATEGORY>",
    "slug": "<CATEGORY-SLUG>",
    "parent_id": null,
    "is_visible": true,
    "header_order": 2
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "id": 2,
      "name": "<CATEGORY>",
      "slug": "<CATEGORY-SLUG>",
      "is_visible": true
    }
    ```

---

### `POST /api/categories/reposition`

Updates the parent-child hierarchy and sibling sort order from drag-and-drop actions.

- **Access**: Admin / Developer
- **Request Body**:
  ```json
  {
    "nodeId": 5,
    "newParentId": 1,
    "siblingOrders": [
      { "id": 5, "order": 0 },
      { "id": 6, "order": 1 }
    ]
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    { "success": true }
    ```

---

## 7. Admin Orders & Fulfillment APIs

### `GET /api/admin/orders`

Paginated search, filter by status, and order list retrieval.

- **Access**: Staff / Admin / Developer
- **Query Parameters**:
  - `page` (number, default: `1`)
  - `pageSize` (number, default: `20`)
  - `status` (`pending` | `confirmed` | `shipped` | `in_transit` | `delivered` | `cancelled`)
  - `search` (string, optional: order number, customer name, or email)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "orders": [
        {
          "id": 42,
          "orderNumber": "JC-ORD-00042",
          "userName": "Yog Mehta",
          "userEmail": "yog@theyogmehta.online",
          "totalAmount": 14999.0,
          "status": "confirmed",
          "createdAt": "2026-09-22T15:20:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    }
    ```

---

### `GET /api/admin/orders/[id]`

Retrieves complete order record with shipping address, items, and audit history.

- **Access**: Staff / Admin / Developer
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": 42,
      "orderNumber": "JC-ORD-00042",
      "status": "confirmed",
      "totalAmount": 14999.0,
      "shippingAddress": {
        "fullName": "Yog Mehta",
        "city": "Mumbai",
        "pincode": "<pin_code>"
      },
      "items": [
        {
          "id": 61,
          "productName": "<PRODUCT>",
          "quantity": 1,
          "unitPrice": 14999.0
        }
      ]
    }
    ```

---

### `PATCH /api/admin/orders/[id]`

Updates order status or assigns shipping courier tracking.

- **Access**: Staff / Admin / Developer
- **Option A: Status Update Request**:
  ```json
  {
    "action": "update_status",
    "status": "shipped",
    "adminNotes": "Handed over to BlueDart pickup"
  }
  ```
- **Option B: Tracking Assignment Request**:
  ```json
  {
    "action": "set_tracking",
    "courier": "Blue Dart",
    "trackingId": "BLUEDART12345678",
    "trackingUrl": "https://www.bluedart.com/tracking/BLUEDART12345678",
    "sendEmail": true
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "order": {
        "id": 42,
        "status": "shipped",
        "trackingId": "BLUEDART12345678"
      }
    }
    ```

---

### `GET /api/admin/orders/stats`

Retrieves daily time series, monthly metrics, and status distribution for charts.

- **Access**: Staff / Admin / Developer
- **Query Parameters**:
  - `days` (number, default: `30`)
  - `months` (number, default: `6`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "overview": {
        "totalOrders": 128,
        "totalRevenue": 1845000,
        "avgOrderValue": 14414,
        "ordersToday": 4,
        "revenueToday": 59996
      },
      "monthlyStats": [
        { "month": "2026-09", "revenue": 450000, "orderCount": 32 }
      ],
      "statusCounts": {
        "pending": 3,
        "confirmed": 8,
        "shipped": 14,
        "delivered": 103
      }
    }
    ```

---

## 8. Admin User Management APIs

### `GET /api/admin/users`

Lists registered users, roles, and verification status.

- **Access**: Admin / Developer Only
- **Query Parameters**:
  - `q` (string, optional: search query)
  - `filter` (`team` | `customer` | `all`, default: `team`)
  - `page` (number, default: `1`)
  - `pageSize` (number, default: `12`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "users": [
        {
          "id": 3,
          "name": "Yog",
          "email": "yog-2@gmail.com",
          "role": "staff",
          "provider": "google",
          "email_verified": true,
          "created_at": "2026-08-10T11:00:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 12,
      "totalPages": 1
    }
    ```

---

### `POST /api/admin/users`

Invites or creates a new staff or admin user.

- **Access**: Developer Only
- **Request Body**:
  ```json
  {
    "name": "Yog Mehta",
    "email": "yog-2@gmail.com",
    "password": "SecurePassword123!",
    "role": "staff"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "user": {
        "id": 9,
        "name": "Yog Mehta",
        "email": "yog-2@gmail.com",
        "role": "staff"
      }
    }
    ```

---

### `PATCH /api/admin/users`

Updates an existing user's role.

- **Access**: Developer Only
- **Request Body**:
  ```json
  {
    "userId": 9,
    "role": "admin"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "user": {
        "id": 9,
        "role": "admin"
      }
    }
    ```

---

### `DELETE /api/admin/users`

Deletes a user account.

- **Access**: Developer Only
- **Request Body**:
  ```json
  { "userId": 9 }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "User deleted successfully"
    }
    ```

---

## 9. Content & Marketing APIs

### `GET /api/admin/content`

Fetches configured hero banners and marketing content.

- **Access**: Staff / Admin / Developer
- **Query Parameters**:
  - `page` (`home` | `about` | `contact` | `discover`, optional)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "home": {
        "hero_badge": "Festive Collection 2026",
        "hero_title": "Timeless Elegance in Pure Gold",
        "hero_subtitle": "Handcrafted fine jewellery curated for special moments",
        "hero_media_url": "/uploads/hero/banner.webp",
        "hero_media_type": "image"
      }
    }
    ```

---

### `POST /api/admin/content`

Updates page copy or uploads new hero video/image banners.

- **Access**: Admin / Developer Only
- **Request Format**: `multipart/form-data`
  - `page_key`: `home`
  - `hero_title`: `Timeless Elegance in Pure Gold`
  - `hero_media`: File (optional image or video file)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "content": {
        "page_key": "home",
        "hero_title": "Timeless Elegance in Pure Gold",
        "hero_media_url": "/uploads/hero/banner.webp"
      }
    }
    ```

---

## 10. Analytics Telemetry API

### `POST /api/analytics/track`

Zero-cookie visitor event telemetry for hotspots and audience analytics.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "sessionId": "an_session_1727011928_xyz",
    "visitorId": "v_f81d4fae-7dec-11d0-a765",
    "path": "/products/18k-gold-solitaire-ring",
    "referrer": "https://instagram.com",
    "durationSeconds": 45,
    "fingerprintHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    { "ok": true }
    ```
  - `400 Bad Request`:
    ```json
    { "ok": false, "message": "Missing sessionId or path" }
    ```

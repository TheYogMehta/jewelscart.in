-- Up Migration
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  order_number    VARCHAR(30) NOT NULL UNIQUE,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email      VARCHAR(255) NOT NULL,
  user_name       VARCHAR(255),

  status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                  CHECK (status IN (
                    'pending', 'confirmed', 'processing', 'shipped',
                    'in_transit', 'delivered', 'completed',
                    'cancelled'
                  )),

  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_fee    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,

  shipping_address JSONB NOT NULL DEFAULT '{}',

  payment_id        VARCHAR(255),
  payment_order_id  VARCHAR(255),
  payment_signature VARCHAR(512),
  payment_method    VARCHAR(50),

  tracking_id       VARCHAR(255),
  tracking_url      VARCHAR(1024),
  tracking_courier  VARCHAR(100),

  admin_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name  VARCHAR(255) NOT NULL,
  product_slug  VARCHAR(255),
  product_image VARCHAR(1024),
  product_sku   VARCHAR(100),
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price   NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_reservations (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(128) NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires    ON cart_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_session    ON cart_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_product    ON cart_reservations(product_id);

-- Down Migration
DROP TABLE IF EXISTS cart_reservations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
-- Up Migration

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT NOT NULL,
  media JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  category VARCHAR(255) NOT NULL,
  sub_category VARCHAR(255),
  child_category VARCHAR(255),
  sku VARCHAR(255) UNIQUE,
  price NUMERIC(10, 2),
  qty INTEGER DEFAULT 0,
  length VARCHAR(100),
  weight VARCHAR(100),
  stock_status VARCHAR(50) DEFAULT 'out_of_stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role VARCHAR(50) DEFAULT 'user',
  provider VARCHAR(50) DEFAULT 'credentials',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  google_linked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  banner_url TEXT,
  banner_type VARCHAR(20) DEFAULT 'image',
  show_in_header BOOLEAN DEFAULT TRUE,
  header_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_categories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES sub_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  banner_type VARCHAR(20) DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_content (
  id SERIAL PRIMARY KEY,
  page_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  badge_text VARCHAR(100),
  bg_type VARCHAR(20) DEFAULT 'image',
  bg_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_name VARCHAR(255),
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  target_name VARCHAR(255),
  details JSONB,
  ip VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  address_type VARCHAR(20) DEFAULT 'home',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(100),
  ip_hash VARCHAR(64),
  fingerprint_hash VARCHAR(64),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  path VARCHAR(255) NOT NULL,
  referrer TEXT,
  duration_seconds INTEGER DEFAULT 0,
  ip VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100),
  device_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category        ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sub_category    ON products(sub_category);
CREATE INDEX IF NOT EXISTS idx_products_child_category  ON products(child_category);
CREATE INDEX IF NOT EXISTS idx_products_slug            ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id     ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_parent_id ON sub_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_slug      ON sub_categories(slug);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id        ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created        ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_path           ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_vid            ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_iphash         ON analytics_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_fingerprint    ON analytics_events(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_logs_created             ON activity_logs(created_at);

-- Down Migration

DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS site_content CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;

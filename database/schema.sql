PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) BETWEEN 1 AND 80),
  description TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  sku TEXT NOT NULL UNIQUE CHECK(length(trim(sku)) BETWEEN 1 AND 40),
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  material TEXT NOT NULL,
  size_guide TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  size TEXT NOT NULL CHECK(size IN ('XS','S','M','L','XL','ONE SIZE')),
  colour TEXT NOT NULL CHECK(length(trim(colour)) BETWEEN 1 AND 40),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  UNIQUE(product_id, size, colour)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK(length(trim(email)) BETWEEN 5 AND 254),
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Confirmed','Packed','Shipped','Delivered','Cancelled')),
  subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents >= 0),
  shipping_cents INTEGER NOT NULL CHECK(shipping_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents = subtotal_cents + shipping_cents),
  shipping_name TEXT NOT NULL CHECK(length(trim(shipping_name)) BETWEEN 1 AND 80),
  address TEXT NOT NULL CHECK(length(trim(address)) BETWEEN 4 AND 160),
  city TEXT NOT NULL CHECK(length(trim(city)) BETWEEN 2 AND 80),
  postcode TEXT NOT NULL CHECK(length(trim(postcode)) BETWEEN 3 AND 12),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10),
  unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
CREATE TABLE users(user_id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE CHECK(length(trim(username))>0),email TEXT NOT NULL UNIQUE CHECK(length(trim(email))>0),password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('customer','admin')));
CREATE TABLE categories(category_id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE CHECK(length(trim(name))>0));
CREATE TABLE products(product_id INTEGER PRIMARY KEY,category_id INTEGER NOT NULL REFERENCES categories(category_id),name TEXT NOT NULL CHECK(length(trim(name))>0),description TEXT NOT NULL,price REAL NOT NULL CHECK(price>0),brand TEXT NOT NULL,image TEXT NOT NULL,gender TEXT NOT NULL,original_price REAL CHECK(original_price>0),rating REAL NOT NULL CHECK(rating BETWEEN 0 AND 5),review_count INTEGER NOT NULL CHECK(review_count>=0),is_new INTEGER NOT NULL CHECK(is_new IN(0,1)),is_sale INTEGER NOT NULL CHECK(is_sale IN(0,1)));
CREATE TABLE product_variants(variant_id INTEGER PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES products(product_id),size TEXT NOT NULL CHECK(length(trim(size))>0),colour TEXT NOT NULL CHECK(length(trim(colour))>0),stock_level INTEGER NOT NULL CHECK(stock_level>=0),UNIQUE(product_id,size,colour));
CREATE TABLE carts(cart_id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id));
CREATE TABLE cart_items(cartitems_id INTEGER PRIMARY KEY,cart_id INTEGER NOT NULL REFERENCES carts(cart_id),variant_id INTEGER NOT NULL REFERENCES product_variants(variant_id),quantity INTEGER NOT NULL CHECK(quantity>0),UNIQUE(cart_id,variant_id));
CREATE TABLE orders(order_id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(user_id),order_number TEXT NOT NULL UNIQUE,customer_email TEXT NOT NULL,customer_address TEXT NOT NULL CHECK(length(trim(customer_address))>0),total_cost INTEGER NOT NULL CHECK(total_cost>=0),status TEXT NOT NULL CHECK(status IN('processing','shipped','delivered','cancelled')),ordered_at TEXT NOT NULL);
CREATE TABLE order_items(orderitems_id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(order_id),variant_id INTEGER NOT NULL REFERENCES product_variants(variant_id),price INTEGER NOT NULL CHECK(price>0),quantity INTEGER NOT NULL CHECK(quantity>0), item_name TEXT NOT NULL CHECK(length(trim(item_name))>0));
CREATE TABLE payments(payment_id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(order_id),status TEXT NOT NULL CHECK(status IN('pending','succeeded','failed','refunded')),transaction_ref TEXT NOT NULL UNIQUE,amount INTEGER NOT NULL CHECK(amount>0));
CREATE TABLE sessions(session_id INTEGER PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE newsletter_subscribers(subscriber_id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL);
CREATE INDEX cart_items_variant_idx ON cart_items(variant_id);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_variant_idx ON order_items(variant_id);
CREATE INDEX orders_user_idx ON orders(user_id);
CREATE INDEX payments_order_idx ON payments(order_id);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX variants_product_idx ON product_variants(product_id);
CREATE VIEW cart_item_details AS
SELECT ci.cartitems_id,ci.cart_id,p.product_id,p.name AS item_name,v.variant_id,
v.size,v.colour,ci.quantity,p.price AS unit_price_aud,
ROUND(ci.quantity*p.price,2) AS line_total_aud
FROM cart_items ci JOIN product_variants v USING(variant_id)
JOIN products p USING(product_id);
CREATE VIEW order_item_details AS
SELECT oi.orderitems_id,o.order_number,oi.item_name,v.variant_id,v.size,v.colour,
oi.quantity,oi.price/100.0 AS unit_price_aud,
(oi.quantity*oi.price)/100.0 AS line_total_aud
FROM order_items oi JOIN orders o USING(order_id)
JOIN product_variants v USING(variant_id);
CREATE VIEW product_catalogue AS
SELECT p.product_id,p.name AS item_name,c.name AS category,p.price AS price_aud,
p.brand,p.description,SUM(v.stock_level) AS total_stock
FROM products p JOIN categories c USING(category_id)
JOIN product_variants v USING(product_id)
GROUP BY p.product_id;
COMMIT;

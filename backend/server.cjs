const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectRoot = path.join(__dirname, "..");
const dbPath = process.env.DATABASE_PATH || path.join(projectRoot, "database", "popculture.db");
const distPath = path.join(projectRoot, "dist");
const sessionCookie = "popculture_session";
const scryptAsync = util.promisify(crypto.scrypt);

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use((_request, response, next) => {
  response.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  next();
});

let db;

function all(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, parameters, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

function get(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, parameters, (error, row) => (error ? reject(error) : resolve(row)));
  });
}

function run(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, parameters, function handleResult(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, salt, expectedHex] = String(encoded).split("$");
    if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
    const actual = await scryptAsync(password, salt, expectedHex.length / 2, { N: Number(n), r: Number(r), p: Number(p) });
    return crypto.timingSafeEqual(Buffer.from(expectedHex, "hex"), actual);
  } catch {
    return false;
  }
}

function publicUser(row) {
  return { id: row.user_id, name: row.username, email: row.email, role: row.role };
}

async function createSession(response, userId, remember = true) {
  const token = crypto.randomBytes(32).toString("base64url");
  const lifetimeSeconds = remember ? 7 * 24 * 60 * 60 : 12 * 60 * 60;
  const expires = new Date(Date.now() + lifetimeSeconds * 1000);
  await run("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)", [tokenHash(token), userId, expires.toISOString(), new Date().toISOString()]);
  response.setHeader("Set-Cookie", `${sessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${lifetimeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

async function authenticate(request, _response, next) {
  try {
    const raw = parseCookies(request.headers.cookie)[sessionCookie];
    if (raw) request.user = await get(`SELECT u.user_id,u.username,u.email,u.role,s.session_id FROM sessions s JOIN users u USING(user_id) WHERE s.token_hash=? AND s.expires_at>?`, [tokenHash(raw), new Date().toISOString()]);
    next();
  } catch (error) { next(error); }
}

function requireAuth(request, response, next) {
  return request.user ? next() : response.status(401).json({ error: "Please sign in to continue" });
}

function requireAdmin(request, response, next) {
  if (!request.user) return response.status(401).json({ error: "Please sign in to continue" });
  return request.user.role === "admin" ? next() : response.status(403).json({ error: "Administrator access is required" });
}

function validateProduct(input) {
  const product = {
    name: String(input.name || "").trim(),
    description: String(input.description || "").trim(),
    price: Number(input.price),
    brand: String(input.brand || "").trim(),
    image: String(input.image || "").trim(),
    gender: String(input.gender || "").trim().toLowerCase(),
    category: String(input.category || "").trim().toLowerCase(),
    originalPrice: input.originalPrice == null || input.originalPrice === "" ? null : Number(input.originalPrice),
    rating: input.rating == null ? 0 : Number(input.rating),
    reviewCount: input.reviewCount == null ? 0 : Number(input.reviewCount),
    isNew: input.isNew ? 1 : 0,
    isSale: input.isSale ? 1 : 0,
    colors: [...new Set((Array.isArray(input.colors) ? input.colors : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean))],
    sizes: [...new Set((Array.isArray(input.sizes) ? input.sizes : []).map((value) => String(value).trim()).filter(Boolean))],
  };

  const errors = [];
  if (!product.name) errors.push("Product name is required");
  if (!product.description) errors.push("Description is required");
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push("Price must be greater than zero");
  if (!product.brand) errors.push("Brand is required");
  if (!product.image) errors.push("Image URL is required");
  if (!["women", "men", "unisex"].includes(product.gender)) errors.push("Gender must be women, men, or unisex");
  if (!product.category) errors.push("Category is required");
  if (product.originalPrice !== null && (!Number.isFinite(product.originalPrice) || product.originalPrice <= 0)) errors.push("Original price must be greater than zero");
  if (!Number.isFinite(product.rating) || product.rating < 0 || product.rating > 5) errors.push("Rating must be between zero and five");
  if (!Number.isInteger(product.reviewCount) || product.reviewCount < 0) errors.push("Review count must be a non-negative whole number");
  if (product.colors.length === 0) errors.push("At least one colour is required");
  if (product.sizes.length === 0) errors.push("At least one size is required");

  return { product, errors };
}

async function productById(productId) {
  const rows = await all(`
    SELECT p.product_id AS id, p.name, p.description, p.price,
      p.brand, p.image, p.gender, p.original_price AS originalPrice,
      p.rating, p.review_count AS reviewCount, p.is_new AS isNew,
      p.is_sale AS isSale, c.name AS category
    FROM products p
    JOIN categories c USING(category_id)
    WHERE p.product_id = ?
  `, [productId]);
  if (rows.length === 0) return null;

  const variants = await all(
    "SELECT size, colour FROM product_variants WHERE product_id = ? ORDER BY variant_id",
    [productId]
  );
  const product = rows[0];
  return {
    ...product,
    originalPrice: product.originalPrice ?? undefined,
    isNew: Boolean(product.isNew),
    isSale: Boolean(product.isSale),
    colors: [...new Set(variants.map((variant) => variant.colour))],
    sizes: [...new Set(variants.map((variant) => variant.size))],
  };
}

async function saveVariants(productId, sizes, colors) {
  for (const size of sizes) {
    for (const colour of colors) {
      await run(
        "INSERT INTO product_variants(product_id, size, colour, stock_level) VALUES(?, ?, ?, ?)",
        [productId, size, colour, 25]
      );
    }
  }
}

async function ensureCart(userId) {
  await run("INSERT OR IGNORE INTO carts(user_id) VALUES(?)", [userId]);
  return get("SELECT cart_id FROM carts WHERE user_id=?", [userId]);
}

async function serializedCart(userId) {
  const rows = await all(`SELECT ci.cartitems_id AS cartItemId,ci.quantity,v.size,v.colour AS color,
    p.product_id AS id,p.name,p.description,p.price,p.brand,p.image,p.gender,p.original_price AS originalPrice,
    p.rating,p.review_count AS reviewCount,p.is_new AS isNew,p.is_sale AS isSale,c.name AS category
    FROM carts ca JOIN cart_items ci USING(cart_id) JOIN product_variants v USING(variant_id)
    JOIN products p USING(product_id) JOIN categories c USING(category_id)
    WHERE ca.user_id=? ORDER BY ci.cartitems_id`, [userId]);
  return rows.map((row) => ({ cartItemId: row.cartItemId, quantity: row.quantity, size: row.size, color: row.color, product: {
    id: row.id, name: row.name, description: row.description, price: row.price, brand: row.brand,
    image: row.image, gender: row.gender, originalPrice: row.originalPrice ?? undefined,
    rating: row.rating, reviewCount: row.reviewCount, isNew: Boolean(row.isNew), isSale: Boolean(row.isSale),
    category: row.category, colors: [row.color], sizes: [row.size],
  }}));
}

app.use(authenticate);

app.post("/api/auth/register", async (request, response) => {
  const name = String(request.body.name || "").trim().replace(/\s+/g, " ");
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");
  const errors = [];
  if (name.length < 2 || name.length > 80) errors.push("Enter a name between 2 and 80 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email address");
  if (password.length < 8 || password.length > 128 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) errors.push("Password must be 8-128 characters and include a letter and number");
  if (errors.length) return response.status(400).json({ error: "Validation failed", details: errors });
  try {
    if (await get("SELECT user_id FROM users WHERE lower(email)=?", [email])) return response.status(409).json({ error: "An account already exists for this email" });
    const result = await run("INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,'customer')", [name, email, await hashPassword(password)]);
    await ensureCart(result.lastID); await createSession(response, result.lastID, true);
    return response.status(201).json({ user: { id: result.lastID, name, email, role: "customer" } });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") return response.status(409).json({ error: "That name or email is already in use" });
    throw error;
  }
});

app.post("/api/auth/login", async (request, response) => {
  const identifier = String(request.body.email || "").trim().toLowerCase();
  const user = await get("SELECT user_id,username,email,password_hash,role FROM users WHERE lower(email)=? OR lower(username)=?", [identifier, identifier]);
  if (!user || !(await verifyPassword(String(request.body.password || ""), user.password_hash))) return response.status(401).json({ error: "Email or password is incorrect" });
  await run("DELETE FROM sessions WHERE expires_at<=?", [new Date().toISOString()]);
  await createSession(response, user.user_id, request.body.remember !== false);
  return response.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", async (request, response) => {
  const raw = parseCookies(request.headers.cookie)[sessionCookie];
  if (raw) await run("DELETE FROM sessions WHERE token_hash=?", [tokenHash(raw)]);
  response.setHeader("Set-Cookie", `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return response.status(204).end();
});

app.get("/api/auth/me", (request, response) => response.json({ user: request.user ? publicUser(request.user) : null }));

app.patch("/api/auth/profile", requireAuth, async (request, response) => {
  const name = String(request.body.name || "").trim().replace(/\s+/g, " ");
  const email = String(request.body.email || "").trim().toLowerCase();
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: "Enter a valid name and email address" });
  try {
    await run("UPDATE users SET username=?,email=? WHERE user_id=?", [name, email, request.user.user_id]);
    return response.json({ user: { id: request.user.user_id, name, email, role: request.user.role } });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") return response.status(409).json({ error: "That name or email is already in use" });
    throw error;
  }
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", database: "connected" });
});

app.get("/api/products", async (_request, response) => {
  try {
    const products = await all(`
      SELECT p.product_id AS id, p.name, p.description, p.price,
        p.brand, p.image, p.gender, p.original_price AS originalPrice,
        p.rating, p.review_count AS reviewCount, p.is_new AS isNew,
        p.is_sale AS isSale, c.name AS category
      FROM products p
      JOIN categories c USING(category_id)
      ORDER BY p.product_id
    `);
    const variants = await all(
      "SELECT product_id, size, colour FROM product_variants ORDER BY variant_id"
    );

    response.json(products.map((product) => {
      const options = variants.filter((variant) => variant.product_id === product.id);
      return {
        ...product,
        originalPrice: product.originalPrice ?? undefined,
        isNew: Boolean(product.isNew),
        isSale: Boolean(product.isSale),
        colors: [...new Set(options.map((variant) => variant.colour))],
        sizes: [...new Set(options.map((variant) => variant.size))],
      };
    }));
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ error: "Unable to retrieve products" });
  }
});

app.get("/api/products/:id", async (request, response) => {
  const productId = Number(request.params.id);
  if (!Number.isInteger(productId) || productId <= 0) return response.status(400).json({ error: "Invalid product ID" });

  try {
    const product = await productById(productId);
    if (!product) return response.status(404).json({ error: "Product not found" });
    return response.json(product);
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({ error: "Unable to retrieve product" });
  }
});

app.get("/api/categories", async (_request, response) => {
  try {
    response.json(await all(
      "SELECT category_id AS id, name FROM categories ORDER BY category_id"
    ));
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ error: "Unable to retrieve categories" });
  }
});

app.post("/api/products", requireAdmin, async (request, response) => {
  const { product, errors } = validateProduct(request.body);
  if (errors.length) return response.status(400).json({ error: "Validation failed", details: errors });

  try {
    const category = await get("SELECT category_id AS id FROM categories WHERE lower(name) = ?", [product.category]);
    if (!category) return response.status(400).json({ error: "Validation failed", details: ["Category does not exist"] });

    await run("BEGIN IMMEDIATE");
    const result = await run(`
      INSERT INTO products(category_id, name, description, price, brand, image, gender,
        original_price, rating, review_count, is_new, is_sale)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [category.id, product.name, product.description, product.price, product.brand,
      product.image, product.gender, product.originalPrice, product.rating,
      product.reviewCount, product.isNew, product.isSale]);
    await saveVariants(result.lastID, product.sizes, product.colors);
    await run("COMMIT");
    return response.status(201).json(await productById(result.lastID));
  } catch (error) {
    await run("ROLLBACK").catch(() => {});
    console.error(error.message);
    return response.status(500).json({ error: "Unable to create product" });
  }
});

app.put("/api/products/:id", requireAdmin, async (request, response) => {
  const productId = Number(request.params.id);
  if (!Number.isInteger(productId) || productId <= 0) return response.status(400).json({ error: "Invalid product ID" });

  const { product, errors } = validateProduct(request.body);
  if (errors.length) return response.status(400).json({ error: "Validation failed", details: errors });

  try {
    const existing = await get("SELECT product_id FROM products WHERE product_id = ?", [productId]);
    if (!existing) return response.status(404).json({ error: "Product not found" });
    const category = await get("SELECT category_id AS id FROM categories WHERE lower(name) = ?", [product.category]);
    if (!category) return response.status(400).json({ error: "Validation failed", details: ["Category does not exist"] });

    await run("BEGIN IMMEDIATE");
    await run(`
      UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, brand = ?,
        image = ?, gender = ?, original_price = ?, rating = ?, review_count = ?, is_new = ?, is_sale = ?
      WHERE product_id = ?
    `, [category.id, product.name, product.description, product.price, product.brand,
      product.image, product.gender, product.originalPrice, product.rating,
      product.reviewCount, product.isNew, product.isSale, productId]);
    await run("DELETE FROM product_variants WHERE product_id = ?", [productId]);
    await saveVariants(productId, product.sizes, product.colors);
    await run("COMMIT");
    return response.json(await productById(productId));
  } catch (error) {
    await run("ROLLBACK").catch(() => {});
    console.error(error.message);
    return response.status(500).json({ error: "Unable to update product" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (request, response) => {
  const productId = Number(request.params.id);
  if (!Number.isInteger(productId) || productId <= 0) return response.status(400).json({ error: "Invalid product ID" });

  try {
    const existing = await get("SELECT product_id FROM products WHERE product_id = ?", [productId]);
    if (!existing) return response.status(404).json({ error: "Product not found" });

    await run("BEGIN IMMEDIATE");
    await run("DELETE FROM product_variants WHERE product_id = ?", [productId]);
    await run("DELETE FROM products WHERE product_id = ?", [productId]);
    await run("COMMIT");
    return response.status(204).end();
  } catch (error) {
    await run("ROLLBACK").catch(() => {});
    console.error(error.message);
    const status = error.code === "SQLITE_CONSTRAINT" ? 409 : 500;
    return response.status(status).json({
      error: status === 409 ? "Product cannot be deleted because it is used by an order or cart" : "Unable to delete product",
    });
  }
});

app.get("/api/cart", requireAuth, async (request, response) => {
  response.json({ items: await serializedCart(request.user.user_id) });
});

app.post("/api/cart/items", requireAuth, async (request, response) => {
  const productId = Number(request.body.productId);
  const quantity = Number(request.body.quantity || 1);
  const size = String(request.body.size || "");
  const color = String(request.body.color || "").toLowerCase();
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return response.status(400).json({ error: "Invalid cart item" });
  const variant = await get("SELECT variant_id,stock_level FROM product_variants WHERE product_id=? AND size=? AND lower(colour)=?", [productId, size, color]);
  if (!variant) return response.status(404).json({ error: "Selected product option is unavailable" });
  const cart = await ensureCart(request.user.user_id);
  const existing = await get("SELECT cartitems_id,quantity FROM cart_items WHERE cart_id=? AND variant_id=?", [cart.cart_id, variant.variant_id]);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > variant.stock_level) return response.status(409).json({ error: "Requested quantity is not available" });
  if (existing) await run("UPDATE cart_items SET quantity=? WHERE cartitems_id=?", [nextQuantity, existing.cartitems_id]);
  else await run("INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES(?,?,?)", [cart.cart_id, variant.variant_id, quantity]);
  return response.status(201).json({ items: await serializedCart(request.user.user_id) });
});

app.patch("/api/cart/items/:id", requireAuth, async (request, response) => {
  const id = Number(request.params.id), quantity = Number(request.body.quantity);
  if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return response.status(400).json({ error: "Quantity must be between 1 and 20" });
  const item = await get("SELECT ci.cartitems_id,v.stock_level FROM cart_items ci JOIN carts c USING(cart_id) JOIN product_variants v USING(variant_id) WHERE ci.cartitems_id=? AND c.user_id=?", [id, request.user.user_id]);
  if (!item) return response.status(404).json({ error: "Cart item not found" });
  if (quantity > item.stock_level) return response.status(409).json({ error: "Requested quantity is not available" });
  await run("UPDATE cart_items SET quantity=? WHERE cartitems_id=?", [quantity, id]);
  return response.json({ items: await serializedCart(request.user.user_id) });
});

app.delete("/api/cart/items/:id", requireAuth, async (request, response) => {
  const result = await run("DELETE FROM cart_items WHERE cartitems_id=? AND cart_id IN(SELECT cart_id FROM carts WHERE user_id=?)", [Number(request.params.id), request.user.user_id]);
  if (!result.changes) return response.status(404).json({ error: "Cart item not found" });
  return response.json({ items: await serializedCart(request.user.user_id) });
});

app.post("/api/orders", requireAuth, async (request, response) => {
  const email = String(request.body.email || request.user.email).trim().toLowerCase();
  const address = String(request.body.address || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || address.length < 10 || address.length > 300) return response.status(400).json({ error: "Enter a valid email and full delivery address" });
  const cart = await get("SELECT cart_id FROM carts WHERE user_id=?", [request.user.user_id]);
  const items = cart ? await all(`SELECT ci.cartitems_id,ci.quantity,v.variant_id,v.stock_level,p.name,p.price FROM cart_items ci JOIN product_variants v USING(variant_id) JOIN products p USING(product_id) WHERE ci.cart_id=?`, [cart.cart_id]) : [];
  if (!items.length) return response.status(400).json({ error: "Your cart is empty" });
  const unavailable = items.find((item) => item.quantity > item.stock_level);
  if (unavailable) return response.status(409).json({ error: `${unavailable.name} does not have enough stock` });
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const total = subtotal + (subtotal >= 15000 ? 0 : 1200) + Math.round(subtotal * 0.1);
  const orderNumber = `PC-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  try {
    await run("BEGIN IMMEDIATE");
    const order = await run("INSERT INTO orders(user_id,order_number,customer_email,customer_address,total_cost,status,ordered_at) VALUES(?,?,?,?,?,'processing',?)", [request.user.user_id, orderNumber, email, address, total, new Date().toISOString()]);
    for (const item of items) {
      await run("INSERT INTO order_items(order_id,variant_id,price,quantity,item_name) VALUES(?,?,?,?,?)", [order.lastID, item.variant_id, Math.round(item.price * 100), item.quantity, item.name]);
      await run("UPDATE product_variants SET stock_level=stock_level-? WHERE variant_id=?", [item.quantity, item.variant_id]);
    }
    await run("INSERT INTO payments(order_id,status,transaction_ref,amount) VALUES(?,'succeeded',?,?)", [order.lastID, `DEMO-${crypto.randomUUID()}`, total]);
    await run("DELETE FROM cart_items WHERE cart_id=?", [cart.cart_id]);
    await run("COMMIT");
    return response.status(201).json({ order: { id: order.lastID, orderNumber, status: "processing", total: total / 100 } });
  } catch (error) { await run("ROLLBACK").catch(() => {}); throw error; }
});

app.get("/api/orders", requireAuth, async (request, response) => {
  response.json({ orders: await all(`SELECT o.order_id AS id,o.order_number AS orderNumber,o.status,o.ordered_at AS orderedAt,o.total_cost/100.0 AS total,COUNT(oi.orderitems_id) AS items FROM orders o LEFT JOIN order_items oi USING(order_id) WHERE o.user_id=? GROUP BY o.order_id ORDER BY o.ordered_at DESC`, [request.user.user_id]) });
});

app.get("/api/admin/orders", requireAdmin, async (_request, response) => {
  response.json({ orders: await all(`SELECT o.order_id AS id,o.order_number AS orderNumber,u.username AS customer,o.customer_email AS email,o.status,o.ordered_at AS orderedAt,o.total_cost/100.0 AS total,COUNT(oi.orderitems_id) AS items FROM orders o JOIN users u USING(user_id) LEFT JOIN order_items oi USING(order_id) GROUP BY o.order_id ORDER BY o.ordered_at DESC`) });
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (request, response) => {
  const status = String(request.body.status || "");
  if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) return response.status(400).json({ error: "Invalid order status" });
  const result = await run("UPDATE orders SET status=? WHERE order_id=?", [status, Number(request.params.id)]);
  return result.changes ? response.json({ status }) : response.status(404).json({ error: "Order not found" });
});

app.post("/api/newsletter", async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: "Enter a valid email address" });
  await run("INSERT OR IGNORE INTO newsletter_subscribers(email,created_at) VALUES(?,?)", [email, new Date().toISOString()]);
  return response.status(201).json({ message: "You are subscribed" });
});

app.use(express.static(distPath));
app.use((request, response) => {
  if (request.path.startsWith("/api/")) {
    return response.status(404).json({ error: "Endpoint not found" });
  }

  const indexFile = path.join(distPath, "index.html");
  if (fs.existsSync(indexFile)) return response.sendFile(indexFile);

  return response.status(200).send(
    "Pop Culture API is running. Run `npm run dev` for the development website or `npm run build` before `npm start`."
  );
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "An unexpected server error occurred" });
});

async function migrateAndSeed() {
  await run("PRAGMA foreign_keys=ON");
  await run("PRAGMA journal_mode=WAL");
  await run("CREATE TABLE IF NOT EXISTS sessions(session_id INTEGER PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)");
  await run("CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)");
  await run("CREATE TABLE IF NOT EXISTS newsletter_subscribers(subscriber_id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL)");
  const demos = [
    ["Amit Pandey", "amit@popculture.com", "amit1234", "admin"],
    ["Nisha Sharma", "customer@popculture.com", "customer123", "customer"],
  ];
  for (const [name, email, password, role] of demos) {
    const existing = await get("SELECT user_id FROM users WHERE email=?", [email]);
    if (existing) await run("UPDATE users SET username=?,password_hash=?,role=? WHERE user_id=?", [name, await hashPassword(password), role, existing.user_id]);
    else await run("INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,?)", [name, email, await hashPassword(password), role]);
  }

  const showcaseProducts = [
    ["Classic Straight Denim Jeans", "Premium straight-leg denim jeans with a clean indigo wash.", 129, "bottoms", "unisex", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop&auto=format", "M", "indigo"],
    ["Essential Cotton T-Shirt", "Soft everyday cotton T-shirt with a relaxed, durable fit.", 59, "tops", "unisex", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&auto=format", "M", "white"],
    ["Tailored Everyday Pants", "Modern tailored pants with stretch comfort and a tapered leg.", 149, "bottoms", "men", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&auto=format", "M", "black"],
  ];
  for (const [name, description, price, categoryName, gender, image, size, colour] of showcaseProducts) {
    let product = await get("SELECT product_id FROM products WHERE name=?", [name]);
    if (!product) {
      const category = await get("SELECT category_id FROM categories WHERE name=?", [categoryName]);
      const inserted = await run("INSERT INTO products(category_id,name,description,price,brand,image,gender,rating,review_count,is_new,is_sale) VALUES(?,?,?,?,?,?,?,4.7,12,1,0)", [category.category_id, name, description, price, "Amit Pandey Studio", image, gender]);
      product = { product_id: inserted.lastID };
    }
    await run("INSERT OR IGNORE INTO product_variants(product_id,size,colour,stock_level) VALUES(?,?,?,50)", [product.product_id, size, colour]);
  }

  const showcaseCustomers = [
    ["Amit Kumar", "amit.kumar@example.com", ["Classic Straight Denim Jeans", "Essential Cotton T-Shirt"], "delivered"],
    ["Sujal Sharma", "sujal.sharma@example.com", ["Tailored Everyday Pants"], "shipped"],
    ["Manoj Thapa", "manoj.thapa@example.com", ["Cloud Runner Sneaker"], "processing"],
    ["Priya Patel", "priya.patel@example.com", ["Black Bias Silk Slip Dress"], "delivered"],
    ["Riya Kapoor", "riya.kapoor@example.com", ["Sculpted Leather Crossbody"], "delivered"],
    ["Ananya Rao", "ananya.rao@example.com", ["Red Tulle City Gown"], "shipped"],
    ["Kabir Mehta", "kabir.mehta@example.com", ["Archive Graphic Hoodie"], "processing"],
    ["Aisha Khan", "aisha.khan@example.com", ["Platform Chelsea Boot"], "delivered"],
    ["Dev Malhotra", "dev.malhotra@example.com", ["Organic Heavyweight Tee"], "cancelled"],
    ["Neha Singh", "neha.singh@example.com", ["Merino Rib Mock-Neck"], "delivered"],
    ["Rahul Verma", "rahul.verma@example.com", ["Washed Linen Button-Down"], "shipped"],
    ["Sneha Joshi", "sneha.joshi@example.com", ["White Pleated Column Dress"], "processing"],
    ["Arjun Nair", "arjun.nair@example.com", ["Tapered Stretch Chino"], "delivered"],
    ["Meera Das", "meera.das@example.com", ["Structured Everyday Tote"], "delivered"],
    ["Vikram Shah", "vikram.shah@example.com", ["Amit Signature Wool Blazer"], "shipped"],
  ];
  const sharedPassword = await hashPassword("customer123");
  for (let index = 0; index < showcaseCustomers.length; index += 1) {
    const [name, email, purchases, status] = showcaseCustomers[index];
    let user = await get("SELECT user_id FROM users WHERE email=?", [email]);
    if (!user) {
      const inserted = await run("INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,'customer')", [name, email, sharedPassword]);
      user = { user_id: inserted.lastID };
    }
    await ensureCart(user.user_id);
    const orderNumber = `SHOWCASE-2026-${String(index + 1).padStart(3, "0")}`;
    if (await get("SELECT order_id FROM orders WHERE order_number=?", [orderNumber])) continue;
    const selected = [];
    for (const productName of purchases) {
      selected.push(await get("SELECT p.product_id,p.name,p.price,v.variant_id FROM products p JOIN product_variants v USING(product_id) WHERE p.name=? ORDER BY v.variant_id LIMIT 1", [productName]));
    }
    const subtotal = selected.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
    const total = subtotal + (subtotal >= 15000 ? 0 : 1200) + Math.round(subtotal * 0.1);
    const order = await run("INSERT INTO orders(user_id,order_number,customer_email,customer_address,total_cost,status,ordered_at) VALUES(?,?,?,?,?,?,?)", [user.user_id, orderNumber, email, `${10 + index} George Street, Sydney NSW 2000`, total, status, new Date(Date.UTC(2026, 9, 1 + index)).toISOString()]);
    for (const item of selected) await run("INSERT INTO order_items(order_id,variant_id,price,quantity,item_name) VALUES(?,?,?,?,?)", [order.lastID, item.variant_id, Math.round(item.price * 100), 1, item.name]);
    await run("INSERT INTO payments(order_id,status,transaction_ref,amount) VALUES(?,'succeeded',?,?)", [order.lastID, `SHOWCASE-PAY-${index + 1}`, total]);
  }
}

db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (error) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
    return;
  }

  try {
    await migrateAndSeed();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Pop Culture server running at http://localhost:${port}`);
    });
  } catch (validationError) {
    console.error("Database validation failed:", validationError.message);
    db.close();
    process.exitCode = 1;
  }
});

function shutdown() {
  if (!db) return process.exit(0);
  db.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectRoot = path.join(__dirname, "..");
const dbPath = path.join(projectRoot, "database", "popculture.db");
const distPath = path.join(projectRoot, "dist");

app.disable("x-powered-by");
app.use(express.json());

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

app.post("/api/products", async (request, response) => {
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

app.put("/api/products/:id", async (request, response) => {
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

app.delete("/api/products/:id", async (request, response) => {
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

db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (error) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
    return;
  }

  try {
    await all("SELECT product_id FROM products LIMIT 1");
    await all("SELECT variant_id FROM product_variants LIMIT 1");
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

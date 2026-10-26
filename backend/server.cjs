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

db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, async (error) => {
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

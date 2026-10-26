import { spawn } from "node:child_process";

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["backend/server.cjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let createdId;

const fixture = {
  name: "Sprint 4 Test Product",
  description: "Temporary product used by the automated CRUD integration test.",
  price: 99,
  brand: "Pop Culture Test",
  image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&auto=format",
  gender: "unisex",
  category: "tops",
  rating: 4.5,
  reviewCount: 0,
  isNew: true,
  isSale: false,
  colors: ["black", "white"],
  sizes: ["S", "M"],
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const { response } = await request("/api/health");
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("API server did not become ready within 10 seconds");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

try {
  await waitForServer();

  const invalid = await request("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Invalid product", price: -1 }),
  });
  assert(invalid.response.status === 400, "validation rejects incomplete product data with HTTP 400");

  const created = await request("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fixture),
  });
  assert(created.response.status === 201, "Create returns HTTP 201");
  createdId = created.body.id;
  assert(Number.isInteger(createdId), "Create returns the database product ID");

  const read = await request(`/api/products/${createdId}`);
  assert(read.response.status === 200 && read.body.name === fixture.name, "Read returns the created product");

  const updated = await request(`/api/products/${createdId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fixture, name: "Sprint 4 Updated Product", price: 109 }),
  });
  assert(updated.response.status === 200, "Update returns HTTP 200");
  assert(updated.body.name === "Sprint 4 Updated Product" && updated.body.price === 109, "Update persists the new name and price");

  const removed = await request(`/api/products/${createdId}`, { method: "DELETE" });
  assert(removed.response.status === 204, "Delete returns HTTP 204");
  createdId = undefined;

  const missing = await request(`/api/products/${updated.body.id}`);
  assert(missing.response.status === 404, "Deleted product returns HTTP 404");

  console.log("CRUD integration test completed successfully.");
} catch (error) {
  if (createdId) {
    await request(`/api/products/${createdId}`, { method: "DELETE" }).catch(() => {});
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}

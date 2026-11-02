import { spawn } from "node:child_process";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}`;
const tempDirectory = await mkdtemp(path.join(tmpdir(), "popculture-api-test-"));
const testDatabase = path.join(tempDirectory, "test.db");
await copyFile(path.join(process.cwd(), "database", "popculture.db"), testDatabase);

const server = spawn(process.execPath, ["backend/server.cjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DATABASE_PATH: testDatabase },
  stdio: ["ignore", "pipe", "pipe"],
});

const fixture = {
  name: "Automated Test Product", description: "Temporary product used by the complete API integration test.",
  price: 99, brand: "Pop Culture Test",
  image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&auto=format",
  gender: "unisex", category: "tops", rating: 4.5, reviewCount: 0,
  isNew: true, isSale: false, colors: ["black", "white"], sizes: ["S", "M"],
};

async function request(route, options = {}, cookie = "") {
  const headers = { ...(options.headers || {}), ...(cookie ? { Cookie: cookie } : {}) };
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json();
  return { response, body, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try { if ((await request("/api/health")).response.ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("API server did not become ready within 15 seconds");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

try {
  await waitForServer();

  const anonymousWrite = await request("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fixture) });
  assert(anonymousWrite.response.status === 401, "anonymous product writes are blocked");

  const adminLogin = await request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "amit@popculture.com", password: "amit1234" }) });
  assert(adminLogin.response.status === 200 && adminLogin.body.user.role === "admin", "administrator signs in with a secure session");
  const adminCookie = adminLogin.cookie;

  const invalid = await request("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Invalid", price: -1 }) }, adminCookie);
  assert(invalid.response.status === 400, "product validation rejects incomplete data");

  const created = await request("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fixture) }, adminCookie);
  assert(created.response.status === 201 && Number.isInteger(created.body.id), "administrator creates a product");
  const createdId = created.body.id;

  const updated = await request(`/api/products/${createdId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fixture, name: "Updated Test Product", price: 109 }) }, adminCookie);
  assert(updated.response.status === 200 && updated.body.price === 109, "administrator updates a product");
  assert((await request(`/api/products/${createdId}`, { method: "DELETE" }, adminCookie)).response.status === 204, "administrator deletes an unused product");

  const unique = Date.now();
  const registration = await request("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Test Customer ${unique}`, email: `customer-${unique}@example.com`, password: "SafePass123" }) });
  assert(registration.response.status === 201 && registration.body.user.role === "customer", "customer registration creates and signs in an account");
  const customerCookie = registration.cookie;
  assert((await request("/api/auth/me", {}, customerCookie)).body.user.email === `customer-${unique}@example.com`, "session restores the signed-in customer");

  const cartAdd = await request("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: 1, size: "M", color: "black", quantity: 2 }) }, customerCookie);
  assert(cartAdd.response.status === 201 && cartAdd.body.items[0].quantity === 2, "cart items persist in SQLite");

  const order = await request("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `customer-${unique}@example.com`, address: "42 Crown Street, Sydney NSW 2000" }) }, customerCookie);
  assert(order.response.status === 201 && order.body.order.orderNumber.startsWith("PC-"), "checkout creates a database order");
  assert((await request("/api/cart", {}, customerCookie)).body.items.length === 0, "successful checkout clears the cart");
  assert((await request("/api/orders", {}, customerCookie)).body.orders.some((entry) => entry.orderNumber === order.body.order.orderNumber), "customer order history returns the new order");

  const adminOrders = await request("/api/admin/orders", {}, adminCookie);
  const storedOrder = adminOrders.body.orders.find((entry) => entry.orderNumber === order.body.order.orderNumber);
  assert(Boolean(storedOrder), "administrator can see the customer order");
  const statusUpdate = await request(`/api/admin/orders/${storedOrder.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "shipped" }) }, adminCookie);
  assert(statusUpdate.response.status === 200 && statusUpdate.body.status === "shipped", "administrator updates order status");

  assert((await request("/api/auth/logout", { method: "POST" }, customerCookie)).response.status === 204, "logout invalidates the session");
  console.log("Complete commerce API integration test passed.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
  await rm(tempDirectory, { recursive: true, force: true });
}

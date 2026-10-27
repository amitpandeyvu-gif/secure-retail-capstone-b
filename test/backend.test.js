import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { initialiseDatabase } from '../src/database.js';

test('database constraints and seed data', () => {
  const db = initialiseDatabase(':memory:');
  try {
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM products').get().n, 6);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM variants').get().n, 11);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 0);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.throws(() => db.prepare('UPDATE products SET price_cents = -1 WHERE id = 1').run());
    assert.throws(() => db.prepare('UPDATE variants SET stock = -1 WHERE id = 1').run());
    assert.throws(() => db.prepare("INSERT INTO variants(product_id,size,colour,stock) VALUES (999,'M','Blue',1)").run());
    assert.throws(() => db.prepare("INSERT INTO variants(product_id,size,colour,stock) VALUES (1,'S','Black',1)").run());
    assert.throws(() => db.prepare('UPDATE products SET price_cents = 1.25 WHERE id = 1').run());
    assert.throws(() => db.prepare("INSERT INTO products(category_id,sku,name,description,price_cents,material,size_guide) VALUES (1,'TEE-SPACE-001','Duplicate','test',100,'cotton','M')").run());
  } finally { db.close(); }
});

test('HTTP routes query SQLite and reject invalid requests', async () => {
  const db = initialiseDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (path) => { const res = await fetch(base + path); return [res.status, await res.json()]; };
  const post = async (path, body) => { const res = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return [res.status, await res.json()]; };
  try {
    assert.equal((await get('/api'))[1].sprint, 3);
    assert.equal((await get('/api/health'))[1].database, 'connected');
    assert.equal((await get('/api/categories'))[1].data.length, 3);
    assert.equal((await get('/api/products'))[1].count, 6);
    assert.equal((await get('/api/products?category=2'))[1].count, 2);
    assert.equal((await get('/api/products?q=arcade'))[1].data[0].id, 2);
    assert.equal((await get('/api/products/1'))[1].data.stock, 27);
    assert.equal((await get('/api/products/1'))[1].data.price_cents, 2995);
    assert.equal((await get('/api/products/1/variants'))[1].data.length, 3);
    db.prepare('UPDATE variants SET stock = 30 WHERE id = 1').run();
    assert.equal((await get('/api/products/1'))[1].data.stock, 49);
    for (const path of ['/api/products/0', '/api/products/1x', '/api/products?category=1x', '/api/products?category=1&category=2', '/api/products?q[x]=x']) {
      assert.equal((await get(path))[0], 400, path);
    }
    assert.equal((await get('/api/products?q=%27%20OR%201%3D1--'))[1].count, 0);
    assert.equal((await post('/api/auth/login', { name: 'Amit Pandey', email: 'amit@example.com' }))[0], 200);
    assert.equal((await post('/api/auth/login', { name: 'Amit', email: 'not-an-email' }))[0], 400);
    assert.equal((await get('/api/admin/dashboard'))[0], 401);
    assert.equal((await post('/api/admin/login', { email: 'admin@popculture.com', password: 'wrong' }))[0], 401);
    const adminLogin = await post('/api/admin/login', { email: 'admin@popculture.com', password: 'Admin123!' });
    assert.equal(adminLogin[0], 200);
    const admin = async (path, method = 'GET', body) => {
      const response = await fetch(base + path, { method, headers: { authorization: `Bearer ${adminLogin[1].token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      return [response.status, await response.json()];
    };
    assert.equal((await admin('/api/admin/dashboard'))[1].summary.products, 6);
    assert.equal((await admin('/api/admin/products'))[1].data.length, 6);
    const created = await admin('/api/admin/products', 'POST', { category_id: 3, sku: 'CAP-TEST-009', name: 'Test Cap', description: 'Admin test product', price_cents: 1595, material: 'Cotton', size_guide: 'Adjustable', size: 'ONE SIZE', colour: 'Black', stock: 5 });
    assert.equal(created[0], 201);
    assert.equal((await admin(`/api/admin/variants/${db.prepare("SELECT id FROM variants WHERE product_id = ?").get(created[1].id).id}`, 'PATCH', { stock: 9 }))[0], 200);
    assert.equal((await admin(`/api/admin/products/${created[1].id}`, 'PUT', { category_id: 3, sku: 'CAP-TEST-009', name: 'Updated Test Cap', description: 'Updated admin test product', price_cents: 1695, material: 'Cotton', size_guide: 'Adjustable' }))[0], 200);
    assert.equal((await admin(`/api/admin/products/${created[1].id}`, 'DELETE'))[0], 200);
    const order = await post('/api/orders', {
      name: 'Amit Pandey', email: 'amit@example.com', address: '10 Example Street', city: 'Melbourne', postcode: '3000',
      items: [{ variant_id: 1, quantity: 2 }]
    });
    assert.equal(order[0], 201);
    assert.equal(order[1].order.total_cents, 6985);
    assert.equal((await get('/api/orders?email=amit%40example.com'))[1].data.length, 1);
    assert.equal(db.prepare('SELECT stock FROM variants WHERE id = 1').get().stock, 28);
    assert.equal((await admin('/api/admin/orders'))[1].data.length, 1);
    assert.equal((await admin(`/api/admin/orders/${order[1].order.id}`, 'PATCH', { status: 'Packed' }))[0], 200);
    assert.equal((await admin('/api/admin/customers'))[1].data[0].order_count, 1);
    for (const path of ['/api/products/999', '/api/products/999/variants', '/missing']) {
      if (path === '/missing') {
        const response = await fetch(base + path);
        assert.equal(response.status, 200, path);
        assert.match(await response.text(), /Pop Culture Clothing/);
      } else {
        assert.equal((await get(path))[0], 404, path);
      }
    }
    const unsupported = await fetch(base + '/api/products', { method: 'POST' });
    assert.equal(unsupported.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
});

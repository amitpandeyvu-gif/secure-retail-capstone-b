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
  try {
    assert.equal((await get('/'))[1].sprint, 3);
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
    for (const path of ['/api/products/999', '/api/products/999/variants', '/missing']) {
      assert.equal((await get(path))[0], 404, path);
    }
    const post = await fetch(base + '/api/products', { method: 'POST' });
    assert.equal(post.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
});

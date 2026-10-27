import express from 'express';
import { resolve } from 'node:path';
import { projectRoot } from './database.js';

function positiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanText(value, min, max) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length >= min && text.length <= max ? text : null;
}

function normaliseEmail(value) {
  return value.trim().toLowerCase();
}

function upsertUser(db, email, name) {
  db.prepare('INSERT OR IGNORE INTO users(email, name) VALUES (?, ?)').run(email, name);
  db.prepare('UPDATE users SET name = ? WHERE email = ?').run(name, email);
  return db.prepare('SELECT id, email, name, created_at FROM users WHERE email = ?').get(email);
}

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api', (_req, res) => res.json({
    project: 'Pop Culture Clothing',
    sprint: 3,
    message: 'Storefront and SQLite API are running.',
    endpoints: ['/api/health', '/api/categories', '/api/products', '/api/auth/login', '/api/orders']
  }));

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'connected', currency: 'AUD' });
  });

  app.get('/api/categories', (_req, res) => {
    res.json({ data: db.prepare('SELECT id, name, description FROM categories ORDER BY id').all() });
  });

  const productSelect = `SELECT p.id, p.sku, p.name, p.description, p.price_cents,
    p.material, p.size_guide, p.category_id, c.name AS category,
    COALESCE((SELECT SUM(stock) FROM variants WHERE product_id = p.id),0) AS stock
    FROM products p JOIN categories c ON c.id = p.category_id`;

  app.get('/api/products', (req, res) => {
    if (Object.keys(req.query).some(key => !['category', 'q'].includes(key))) {
      return res.status(400).json({ error: 'Only category and q filters are supported' });
    }
    const { category, q } = req.query;
    if (category !== undefined && !positiveInteger(category)) {
      return res.status(400).json({ error: 'category must be a positive integer' });
    }
    if (q !== undefined && (typeof q !== 'string' || q.length > 100)) {
      return res.status(400).json({ error: 'q must be a string of at most 100 characters' });
    }
    const where = [];
    const args = [];
    if (category !== undefined) { where.push('p.category_id = ?'); args.push(Number(category)); }
    if (q) { where.push('instr(lower(p.name), lower(?)) > 0'); args.push(q); }
    const sql = productSelect + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY p.id';
    const data = db.prepare(sql).all(...args);
    res.json({ currency: 'AUD', count: data.length, data });
  });

  app.get(['/api/products/:id', '/api/products/:id/variants'], (req, res) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    const product = db.prepare(productSelect + ' WHERE p.id = ?').get(Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (req.path.endsWith('/variants')) {
      return res.json({ data: db.prepare('SELECT id, product_id, size, colour, stock FROM variants WHERE product_id = ? ORDER BY id').all(product.id) });
    }
    res.json({ currency: 'AUD', data: product });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : null;
    const name = cleanText(req.body?.name || email?.split('@')[0] || '', 1, 80);
    if (!email) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!name) return res.status(400).json({ error: 'Name must be between 1 and 80 characters' });
    const user = upsertUser(db, email, name);
    res.json({ user, message: `Welcome, ${user.name}` });
  });

  app.get('/api/orders', (req, res) => {
    if (!validEmail(req.query.email)) return res.status(400).json({ error: 'A valid email is required' });
    const email = normaliseEmail(req.query.email);
    const orders = db.prepare(`SELECT o.id, o.status, o.subtotal_cents, o.shipping_cents,
      o.total_cents, o.shipping_name, o.address, o.city, o.postcode, o.created_at
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE u.email = ? ORDER BY o.id DESC`).all(email);
    const itemQuery = db.prepare(`SELECT oi.product_id, oi.variant_id, oi.quantity, oi.unit_price_cents,
      p.name, v.size, v.colour FROM order_items oi
      JOIN products p ON p.id = oi.product_id JOIN variants v ON v.id = oi.variant_id
      WHERE oi.order_id = ? ORDER BY oi.id`);
    res.json({ data: orders.map(order => ({ ...order, items: itemQuery.all(order.id) })) });
  });

  app.post('/api/orders', (req, res, next) => {
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : null;
    const name = cleanText(req.body?.name, 1, 80);
    const address = cleanText(req.body?.address, 4, 160);
    const city = cleanText(req.body?.city, 2, 80);
    const postcode = cleanText(req.body?.postcode, 3, 12);
    const items = req.body?.items;
    if (!email || !name || !address || !city || !postcode) {
      return res.status(400).json({ error: 'Complete the contact and delivery details' });
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
      return res.status(400).json({ error: 'Order must contain between 1 and 20 items' });
    }
    if (items.some(item => !Number.isInteger(item.variant_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)) {
      return res.status(400).json({ error: 'Each item needs a valid variant and quantity between 1 and 10' });
    }

    try {
      db.exec('BEGIN IMMEDIATE');
      const user = upsertUser(db, email, name);
      const variantQuery = db.prepare(`SELECT v.id, v.product_id, v.stock, p.name, p.price_cents
        FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`);
      const selected = items.map(item => {
        const variant = variantQuery.get(item.variant_id);
        if (!variant) throw new Error('A selected product option no longer exists');
        if (variant.stock < item.quantity) throw new Error(`${variant.name} does not have enough stock`);
        return { ...variant, quantity: item.quantity };
      });
      const subtotal = selected.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
      const shipping = subtotal >= 8000 ? 0 : 995;
      const orderResult = db.prepare(`INSERT INTO orders
        (user_id, subtotal_cents, shipping_cents, total_cents, shipping_name, address, city, postcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(user.id, subtotal, shipping, subtotal + shipping, name, address, city, postcode);
      const orderId = Number(orderResult.lastInsertRowid);
      const insertItem = db.prepare(`INSERT INTO order_items
        (order_id, product_id, variant_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)`);
      const reduceStock = db.prepare('UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const item of selected) {
        if (Number(reduceStock.run(item.quantity, item.id, item.quantity).changes) !== 1) {
          throw new Error(`${item.name} stock changed before checkout`);
        }
        insertItem.run(orderId, item.product_id, item.id, item.quantity, item.price_cents);
      }
      db.exec('COMMIT');
      res.status(201).json({
        order: { id: orderId, status: 'Confirmed', subtotal_cents: subtotal, shipping_cents: shipping, total_cents: subtotal + shipping },
        message: 'Order confirmed'
      });
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch {}
      if (/stock|selected product option/i.test(error.message)) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  app.use(express.static(resolve(projectRoot, 'public'), { extensions: ['html'] }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((_req, res) => res.sendFile(resolve(projectRoot, 'public/index.html')));
  app.use((error, _req, res, _next) => {
    console.error('Request failed:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

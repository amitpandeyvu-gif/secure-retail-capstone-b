import express from 'express';
import { resolve } from 'node:path';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { projectRoot } from './database.js';
import {
  getPersistentOrder,
  listPersistentOrders,
  listPersistentOrdersByEmail,
  nextPersistentOrderId,
  persistentOrdersEnabled,
  savePersistentOrder,
  updatePersistentOrderStatus
} from './order-store.js';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

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

function safeMatch(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function validMoney(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100000000;
}

function signAdminSession(email, expiresAt, secret) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readAdminSession(token, secret) {
  if (typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeMatch(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!validEmail(session.email) || !Number.isFinite(session.expiresAt) || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function safeEmailHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function trackingCheckpointLocation(status, order) {
  const destination = `${order.city} ${order.postcode}`.trim();
  return {
    Confirmed: 'Order received online',
    Packed: 'Pop Culture fulfilment centre',
    Shipped: `Delivery network — en route to ${destination}`,
    Delivered: `${order.address}, ${destination}`,
    Cancelled: 'Order processing stopped'
  }[status] || 'Pop Culture order system';
}

function buildTrackingDetails(order, history) {
  const destination = `${order.address}, ${order.city} ${order.postcode}`;
  const details = {
    Confirmed: {
      progress: 25,
      message: 'Your order is confirmed and waiting to be packed.',
      next_step: 'We will update tracking when your items have been packed.',
      delivery_estimate: 'Dispatch is normally within 1 business day.'
    },
    Packed: {
      progress: 50,
      message: 'Your items are packed and ready for carrier collection.',
      next_step: 'The next update will appear when the parcel is dispatched.',
      delivery_estimate: 'Carrier collection is the next step.'
    },
    Shipped: {
      progress: 75,
      message: `Your parcel is in transit to ${order.city}.`,
      next_step: 'The next update will confirm delivery to the destination.',
      delivery_estimate: 'Delivery is normally 2–5 business days after dispatch.'
    },
    Delivered: {
      progress: 100,
      message: `Your parcel has been delivered to ${order.city}.`,
      next_step: 'Delivery is complete. Contact support if you cannot locate the parcel.',
      delivery_estimate: 'Delivered'
    },
    Cancelled: {
      progress: 0,
      message: 'This order was cancelled and will not be dispatched.',
      next_step: 'Contact support if you need help with this cancellation.',
      delivery_estimate: 'No delivery scheduled'
    }
  }[order.status] || {
    progress: 0,
    message: 'We have received an update for this order.',
    next_step: 'Check again later for more information.',
    delivery_estimate: 'Not yet available'
  };
  const checkpoints = history.map(entry => ({
    ...entry,
    location: trackingCheckpointLocation(entry.status, order)
  }));
  const latest = checkpoints.at(-1);
  return {
    ...details,
    current_location: trackingCheckpointLocation(order.status, order),
    destination,
    last_updated: latest?.created_at || order.created_at,
    checkpoints
  };
}

async function sendStoreEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {})
    })
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email provider returned ${response.status}: ${details.slice(0, 180)}`);
  }
  return true;
}

async function sendLoginEmail({ email, name }) {
  return sendStoreEmail({
    to: email,
    subject: 'You signed in to Pop Culture Clothing',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><div style="padding:20px 24px;background:#111;color:#fff"><strong style="letter-spacing:.12em">POP CULTURE</strong></div><div style="padding:28px 24px;border:1px solid #ddd;border-top:0"><h1 style="margin:0 0 14px;font-size:26px">Welcome, ${safeEmailHtml(name)}</h1><p style="line-height:1.6">Your customer account was used to sign in to Pop Culture Clothing.</p><p style="line-height:1.6">If this was not you, secure your Google account and contact the store administrator.</p><hr style="margin:24px 0;border:0;border-top:1px solid #ddd"><p style="font-size:12px;color:#666">Pop Culture Clothing · Demonstration storefront</p></div></div>`
  });
}

async function sendOrderReceipt({ email, name, order, items, address, city, postcode, transactionRef }) {
  const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
  const itemRows = items.map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${item.quantity}× ${safeEmailHtml(item.name)}<br><span style="font-size:12px;color:#666">${safeEmailHtml(item.size)} · ${safeEmailHtml(item.colour)}</span></td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${money(item.price_cents * item.quantity)}</td></tr>`).join('');
  const baseUrl = (process.env.PUBLIC_APP_URL || 'https://pop-culture-clothing-capstone.vercel.app').replace(/\/$/, '');
  const trackingUrl = `${baseUrl}/?track=${order.id}&email=${encodeURIComponent(email)}`;
  return sendStoreEmail({
    to: email,
    subject: `Order #${order.id} confirmed — your Pop Culture receipt`,
    html: `<div style="display:none;max-height:0;overflow:hidden">Your order #${order.id} is confirmed. View your items, total and tracking details.</div><div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171717;background:#fff"><div style="padding:22px 26px;background:#111;color:#fff"><strong style="letter-spacing:.14em">POP CULTURE CLOTHING</strong></div><div style="padding:30px 26px;border:1px solid #ddd;border-top:0"><p style="margin:0 0 8px;color:#c9341f;font-size:12px;font-weight:700;letter-spacing:.1em">ORDER CONFIRMED · #${order.id}</p><h1 style="margin:0 0 14px;font-size:28px;line-height:1.15">Thanks for your order, ${safeEmailHtml(name)}</h1><p style="margin:0;line-height:1.65;color:#444">We have received your order. You ordered the following items:</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0">${itemRows}<tr><td style="padding-top:12px;color:#666">Subtotal</td><td style="padding-top:12px;text-align:right">${money(order.subtotal_cents)}</td></tr><tr><td style="padding-top:8px;color:#666">Shipping</td><td style="padding-top:8px;text-align:right">${order.shipping_cents ? money(order.shipping_cents) : 'Free'}</td></tr><tr><td style="padding-top:14px;border-top:1px solid #171717;font-size:18px;font-weight:700">Total</td><td style="padding-top:14px;border-top:1px solid #171717;text-align:right;font-size:18px;font-weight:700">${money(order.total_cents)}</td></tr></table><h2 style="margin:28px 0 8px;font-size:18px">Delivery details</h2><p style="margin:0;line-height:1.65">${safeEmailHtml(name)}<br>${safeEmailHtml(address)}<br>${safeEmailHtml(city)} ${safeEmailHtml(postcode)}</p><p style="margin:22px 0;font-size:13px;line-height:1.6;color:#666">Payment status: Succeeded<br>Reference: ${safeEmailHtml(transactionRef)}</p><p style="margin:26px 0"><a href="${safeEmailHtml(trackingUrl)}" style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;font-weight:700">Track order #${order.id}</a></p><p style="font-size:13px;line-height:1.6;color:#666">Keep this email as your receipt. Tracking requires order number <strong>#${order.id}</strong> and <strong>${safeEmailHtml(email)}</strong>.</p><div style="margin-top:24px;padding:14px;border:1px solid #ddd;background:#f5f4f1;font-size:13px;line-height:1.5"><strong>Assessment demonstration:</strong> no real payment was taken and no physical parcel will be dispatched.</div></div></div>`
  });
}

export function createApp(db) {
  const app = express();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || `local-${adminPassword}`;
  const customerSessionSecret = process.env.CUSTOMER_SESSION_SECRET || adminSessionSecret;
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';

  function localAdminOrders() {
    return db.prepare(`SELECT o.*, u.name AS customer_name, u.email FROM orders o
      JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`).all();
  }

  async function combinedAdminOrders() {
    const local = localAdminOrders();
    if (!persistentOrdersEnabled()) return local;
    const persistent = await listPersistentOrders();
    const merged = new Map(local.map(order => [Number(order.id), order]));
    persistent.forEach(order => merged.set(Number(order.id), order));
    return [...merged.values()].sort((a, b) => Number(b.id) - Number(a.id));
  }

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
    endpoints: ['/api/health', '/api/categories', '/api/products', '/api/auth/login', '/api/cart', '/api/orders', '/api/orders/:id/tracking', '/api/contact', '/api/admin/login', '/api/admin/dashboard']
  }));

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'connected', currency: 'AUD' });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      google: { enabled: Boolean(googleClientId), client_id: googleClientId || null },
      email_notifications: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
    });
  });

  app.get('/api/categories', (_req, res) => {
    res.json({ data: db.prepare('SELECT id, name, description FROM categories ORDER BY id').all() });
  });

  const productSelect = `SELECT p.id, p.sku, p.name, p.description, p.price_cents,
    p.material, p.size_guide, p.category_id, c.name AS category,
    COALESCE((SELECT SUM(stock) FROM variants WHERE product_id = p.id),0) AS stock
    FROM products p JOIN categories c ON c.id = p.category_id`;

  app.get('/api/products', (req, res) => {
    const unsupportedFilters = Object.keys(req.query)
      .filter(key => !['category', 'q', 'path', '__path'].includes(key));
    if (unsupportedFilters.length) {
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
    const departmentOrder = `CASE p.category_id
      WHEN 1 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 3
      WHEN 2 THEN 4 WHEN 3 THEN 5 WHEN 6 THEN 6 ELSE 99 END`;
    const sql = productSelect + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ` ORDER BY ${departmentOrder}, p.id`;
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

  app.post('/api/auth/login', async (req, res) => {
    if (googleClientId && process.env.ALLOW_DEMO_LOGIN !== '1') {
      return res.status(403).json({ error: 'Use Google to sign in' });
    }
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : null;
    const name = cleanText(req.body?.name || email?.split('@')[0] || '', 1, 80);
    if (!email) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!name) return res.status(400).json({ error: 'Name must be between 1 and 80 characters' });
    const user = upsertUser(db, email, name);
    db.prepare('INSERT OR IGNORE INTO carts(user_id) VALUES (?)').run(user.id);
    const token = signAdminSession(user.email, Date.now() + (8 * 60 * 60 * 1000), customerSessionSecret);
    let emailSent = false;
    try {
      emailSent = await sendLoginEmail(user);
    } catch (error) {
      console.error('Login email failed:', error.message);
    }
    res.json({ user, token, email_sent: emailSent, message: `Welcome, ${user.name}` });
  });

  app.post('/api/auth/google', async (req, res) => {
    if (!googleClientId) return res.status(503).json({ error: 'Google sign-in is not configured' });
    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
    if (!credential || credential.length > 10000) return res.status(400).json({ error: 'Google credential is required' });
    try {
      const { payload } = await jwtVerify(credential, googleKeys, {
        audience: googleClientId,
        issuer: ['https://accounts.google.com', 'accounts.google.com']
      });
      const email = payload.email_verified && validEmail(payload.email) ? normaliseEmail(payload.email) : null;
      const name = cleanText(payload.name || payload.given_name || email?.split('@')[0] || '', 1, 80);
      if (!email || !name) return res.status(401).json({ error: 'Google did not provide a verified account' });
      const user = upsertUser(db, email, name);
      db.prepare('INSERT OR IGNORE INTO carts(user_id) VALUES (?)').run(user.id);
      const token = signAdminSession(user.email, Date.now() + (8 * 60 * 60 * 1000), customerSessionSecret);
      let emailSent = false;
      try {
        emailSent = await sendLoginEmail(user);
      } catch (error) {
        console.error('Login email failed:', error.message);
      }
      res.json({ user, token, email_sent: emailSent, message: `Welcome, ${user.name}` });
    } catch (error) {
      console.error('Google sign-in failed:', error.code || error.message);
      res.status(401).json({ error: 'Google sign-in could not be verified' });
    }
  });

  const cartItemsQuery = db.prepare(`SELECT ci.variant_id, ci.quantity, v.product_id, v.size, v.colour, v.stock,
    p.name, p.sku, p.price_cents FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
    JOIN variants v ON v.id = ci.variant_id JOIN products p ON p.id = v.product_id
    JOIN users u ON u.id = c.user_id WHERE u.email = ? ORDER BY ci.id`);

  app.get('/api/cart', (req, res) => {
    if (!validEmail(req.query.email)) return res.status(400).json({ error: 'A valid email is required' });
    res.json({ data: cartItemsQuery.all(normaliseEmail(req.query.email)) });
  });

  app.put('/api/cart', (req, res, next) => {
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : null;
    const name = cleanText(req.body?.name || email?.split('@')[0] || '', 1, 80);
    const items = req.body?.items;
    if (!email || !name || !Array.isArray(items) || items.length > 50) return res.status(400).json({ error: 'Provide a valid account and cart items' });
    if (items.some(item => !Number.isInteger(item.variant_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)) return res.status(400).json({ error: 'Cart quantities must be whole numbers from 1 to 10' });
    try {
      db.exec('BEGIN IMMEDIATE');
      const user = upsertUser(db, email, name);
      db.prepare('INSERT OR IGNORE INTO carts(user_id) VALUES (?)').run(user.id);
      const cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(user.id);
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      const variant = db.prepare('SELECT stock FROM variants WHERE id = ?');
      const insert = db.prepare('INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES (?,?,?)');
      for (const item of items) {
        const available = variant.get(item.variant_id);
        if (!available) throw new Error('A cart option no longer exists');
        if (available.stock < item.quantity) throw new Error('A cart quantity exceeds available stock');
        insert.run(cart.id, item.variant_id, item.quantity);
      }
      db.prepare('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);
      db.exec('COMMIT');
      res.json({ data: cartItemsQuery.all(email), message: 'Cart saved' });
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch {}
      if (/cart option|quantity exceeds/i.test(error.message)) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  app.post('/api/contact', (req, res) => {
    const name = cleanText(req.body?.name, 1, 80);
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : null;
    const subject = cleanText(req.body?.subject, 2, 120);
    const message = cleanText(req.body?.message, 10, 2000);
    if (!name || !email || !subject || !message) return res.status(400).json({ error: 'Complete every contact field with valid information' });
    const result = db.prepare('INSERT INTO contact_messages(name,email,subject,message) VALUES (?,?,?,?)').run(name, email, subject, message);
    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Your message has been received' });
  });

  function requireAdmin(req, res, next) {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const session = readAdminSession(token, adminSessionSecret);
    if (!session) {
      return res.status(401).json({ error: 'Administrator sign-in required' });
    }
    req.admin = session;
    next();
  }

  app.post('/api/admin/login', (req, res) => {
    const email = validEmail(req.body?.email) ? normaliseEmail(req.body.email) : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!safeMatch(email, adminEmail) || !safeMatch(password, adminPassword)) {
      return res.status(401).json({ error: 'Incorrect administrator email or password' });
    }
    const expiresAt = Date.now() + (8 * 60 * 60 * 1000);
    const token = signAdminSession(email, expiresAt, adminSessionSecret);
    res.json({ token, admin: { email }, expires_at: new Date(expiresAt).toISOString() });
  });

  app.post('/api/admin/logout', requireAdmin, (_req, res) => {
    res.json({ message: 'Signed out' });
  });

  app.get('/api/admin/dashboard', requireAdmin, async (_req, res, next) => {
    try {
      const orders = await combinedAdminOrders();
      const baseSummary = db.prepare(`SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM users) AS customers,
        (SELECT COUNT(*) FROM variants WHERE stock <= 5) AS low_stock`).get();
      const customerEmails = new Set(db.prepare('SELECT email FROM users').all().map(user => user.email));
      orders.forEach(order => customerEmails.add(order.email));
      const summary = {
        ...baseSummary,
        customers: customerEmails.size,
        orders: orders.length,
        revenue_cents: orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total_cents), 0)
      };
      const recentOrders = orders.slice(0, 6);
    const lowStock = db.prepare(`SELECT v.id AS variant_id, p.id AS product_id, p.name, p.sku,
      v.size, v.colour, v.stock FROM variants v JOIN products p ON p.id = v.product_id
      WHERE v.stock <= 5 ORDER BY v.stock, p.name LIMIT 8`).all();
      res.json({ summary, recent_orders: recentOrders, low_stock: lowStock, persistent_orders: persistentOrdersEnabled() });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/products', requireAdmin, (_req, res) => {
    const products = db.prepare(productSelect + ' ORDER BY p.id DESC').all();
    const variants = db.prepare('SELECT id, product_id, size, colour, stock FROM variants ORDER BY id').all();
    res.json({ data: products.map(product => ({ ...product, variants: variants.filter(item => item.product_id === product.id) })) });
  });

  app.post('/api/admin/products', requireAdmin, (req, res, next) => {
    const categoryId = Number(req.body?.category_id);
    const sku = cleanText(req.body?.sku, 3, 40)?.toUpperCase();
    const name = cleanText(req.body?.name, 1, 120);
    const description = cleanText(req.body?.description, 1, 1000);
    const material = cleanText(req.body?.material, 1, 160);
    const sizeGuide = cleanText(req.body?.size_guide, 1, 240);
    const priceCents = Number(req.body?.price_cents);
    const size = cleanText(req.body?.size, 1, 20)?.toUpperCase();
    const colour = cleanText(req.body?.colour, 1, 40);
    const stock = Number(req.body?.stock);
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'ONE SIZE'];
    if (!Number.isInteger(categoryId) || !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId)) return res.status(400).json({ error: 'Choose a valid category' });
    if (!sku || !/^[A-Z0-9-]+$/.test(sku) || !name || !description || !material || !sizeGuide || !validMoney(priceCents)) return res.status(400).json({ error: 'Complete all product details with a valid SKU and price' });
    if (!sizes.includes(size) || !colour || !Number.isInteger(stock) || stock < 0 || stock > 100000) return res.status(400).json({ error: 'Enter a valid initial size, colour and stock quantity' });
    try {
      db.exec('BEGIN IMMEDIATE');
      const result = db.prepare(`INSERT INTO products(category_id,sku,name,description,price_cents,material,size_guide)
        VALUES (?,?,?,?,?,?,?)`).run(categoryId, sku, name, description, priceCents, material, sizeGuide);
      const productId = Number(result.lastInsertRowid);
      db.prepare('INSERT INTO variants(product_id,size,colour,stock) VALUES (?,?,?,?)').run(productId, size, colour, stock);
      db.exec('COMMIT');
      res.status(201).json({ id: productId, message: 'Product created' });
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch {}
      if (/unique/i.test(error.message)) return res.status(409).json({ error: 'That SKU or product option already exists' });
      next(error);
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    const categoryId = Number(req.body?.category_id);
    const sku = cleanText(req.body?.sku, 3, 40)?.toUpperCase();
    const name = cleanText(req.body?.name, 1, 120);
    const description = cleanText(req.body?.description, 1, 1000);
    const material = cleanText(req.body?.material, 1, 160);
    const sizeGuide = cleanText(req.body?.size_guide, 1, 240);
    const priceCents = Number(req.body?.price_cents);
    if (!Number.isInteger(categoryId) || !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId) || !sku || !/^[A-Z0-9-]+$/.test(sku) || !name || !description || !material || !sizeGuide || !validMoney(priceCents)) {
      return res.status(400).json({ error: 'Complete all product details with valid values' });
    }
    try {
      const result = db.prepare(`UPDATE products SET category_id=?, sku=?, name=?, description=?, price_cents=?, material=?, size_guide=? WHERE id=?`)
        .run(categoryId, sku, name, description, priceCents, material, sizeGuide, Number(req.params.id));
      if (!Number(result.changes)) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product updated' });
    } catch (error) {
      if (/unique/i.test(error.message)) return res.status(409).json({ error: 'That SKU already exists' });
      next(error);
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    try {
      db.exec('BEGIN IMMEDIATE');
      db.prepare('DELETE FROM variants WHERE product_id = ?').run(Number(req.params.id));
      const result = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));
      if (!Number(result.changes)) throw Object.assign(new Error('Product not found'), { status: 404 });
      db.exec('COMMIT');
      res.json({ message: 'Product deleted' });
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch {}
      if (error.status === 404) return res.status(404).json({ error: error.message });
      if (/foreign key/i.test(error.message)) return res.status(409).json({ error: 'Products included in existing orders cannot be deleted' });
      next(error);
    }
  });

  app.patch('/api/admin/variants/:id', requireAdmin, (req, res) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    const stock = Number(req.body?.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return res.status(400).json({ error: 'Stock must be a whole number from 0 to 100000' });
    const result = db.prepare('UPDATE variants SET stock = ? WHERE id = ?').run(stock, Number(req.params.id));
    if (!Number(result.changes)) return res.status(404).json({ error: 'Variant not found' });
    res.json({ message: 'Stock updated' });
  });

  app.post('/api/admin/products/:id/variants', requireAdmin, (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    const size = cleanText(req.body?.size, 1, 20)?.toUpperCase();
    const colour = cleanText(req.body?.colour, 1, 40);
    const stock = Number(req.body?.stock);
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'ONE SIZE'];
    if (!sizes.includes(size) || !colour || !Number.isInteger(stock) || stock < 0 || stock > 100000) return res.status(400).json({ error: 'Enter a valid size, colour and stock quantity' });
    if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(Number(req.params.id))) return res.status(404).json({ error: 'Product not found' });
    try {
      const result = db.prepare('INSERT INTO variants(product_id,size,colour,stock) VALUES (?,?,?,?)').run(Number(req.params.id), size, colour, stock);
      res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Product option added' });
    } catch (error) {
      if (/unique/i.test(error.message)) return res.status(409).json({ error: 'That size and colour already exists' });
      next(error);
    }
  });

  app.delete('/api/admin/variants/:id', requireAdmin, (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    try {
      const result = db.prepare('DELETE FROM variants WHERE id = ?').run(Number(req.params.id));
      if (!Number(result.changes)) return res.status(404).json({ error: 'Variant not found' });
      res.json({ message: 'Product option deleted' });
    } catch (error) {
      if (/foreign key/i.test(error.message)) return res.status(409).json({ error: 'Options used by carts or orders cannot be deleted' });
      next(error);
    }
  });

  app.get('/api/admin/orders', requireAdmin, async (_req, res, next) => {
    try { res.json({ data: await combinedAdminOrders(), persistent: persistentOrdersEnabled() }); }
    catch (error) { next(error); }
  });

  app.patch('/api/admin/orders/:id', requireAdmin, async (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    const statuses = ['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!statuses.includes(req.body?.status)) return res.status(400).json({ error: 'Choose a valid order status' });
    const orderId = Number(req.params.id);
    const localOrder = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    let persistentOrder;
    try { persistentOrder = persistentOrdersEnabled() ? await getPersistentOrder(orderId) : null; }
    catch (error) { return next(error); }
    const order = persistentOrder || localOrder;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === req.body.status) return res.json({ message: 'Order status is already current' });
    try {
      const note = `Order marked ${req.body.status.toLowerCase()}`;
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (persistentOrder) await updatePersistentOrderStatus(orderId, req.body.status, note, createdAt);
      if (localOrder) {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, orderId);
        db.prepare('INSERT INTO order_status_history(order_id,status,note,created_at) VALUES (?,?,?,?)')
          .run(orderId, req.body.status, note, createdAt);
        db.exec('COMMIT');
      }
      res.json({ message: 'Order status updated' });
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch {}
      next(error);
    }
  });

  app.get('/api/admin/customers', requireAdmin, async (_req, res, next) => {
    try {
      const customers = db.prepare('SELECT id, name, email, created_at FROM users ORDER BY id DESC').all();
      const records = new Map(customers.map(customer => [customer.email, { ...customer, order_count: 0, spent_cents: 0 }]));
      for (const order of await combinedAdminOrders()) {
        const customer = records.get(order.email) || { id: `persistent-${order.email}`, name: order.customer_name, email: order.email, created_at: order.created_at, order_count: 0, spent_cents: 0 };
        customer.order_count = Number(customer.order_count) + 1;
        if (order.status !== 'Cancelled') customer.spent_cents = Number(customer.spent_cents) + Number(order.total_cents);
        records.set(order.email, customer);
      }
      res.json({ data: [...records.values()] });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/payments', requireAdmin, async (_req, res, next) => {
    const payments = db.prepare(`SELECT p.id, p.order_id, p.status, p.transaction_ref, p.amount_cents, p.created_at,
      u.name AS customer_name, u.email FROM payments p JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = o.user_id ORDER BY p.id DESC`).all();
    try {
      const persistent = (await listPersistentOrders()).map(order => ({
        id: order.id,
        order_id: order.id,
        status: order.payment_status,
        transaction_ref: order.transaction_ref,
        amount_cents: order.total_cents,
        created_at: order.created_at,
        customer_name: order.customer_name,
        email: order.email
      }));
      const merged = new Map(payments.map(payment => [Number(payment.order_id), payment]));
      persistent.forEach(payment => merged.set(Number(payment.order_id), payment));
      res.json({ data: [...merged.values()].sort((a, b) => Number(b.order_id) - Number(a.order_id)) });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/messages', requireAdmin, (_req, res) => {
    res.json({ data: db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all() });
  });

  app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
    if (!['New', 'Resolved'].includes(req.body?.status)) return res.status(400).json({ error: 'Choose a valid message status' });
    const result = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(req.body.status, Number(req.params.id));
    if (!Number(result.changes)) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message status updated' });
  });

  app.get('/api/orders', async (req, res, next) => {
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
    try {
      const local = orders.map(order => ({ ...order, items: itemQuery.all(order.id) }));
      const persistent = await listPersistentOrdersByEmail(email);
      const merged = new Map(local.map(order => [Number(order.id), order]));
      persistent.forEach(order => merged.set(Number(order.id), order));
      res.json({ data: [...merged.values()].sort((a, b) => Number(b.id) - Number(a.id)), persistent: persistentOrdersEnabled() });
    } catch (error) { next(error); }
  });

  app.get('/api/orders/:id/tracking', async (req, res, next) => {
    if (!positiveInteger(req.params.id)) return res.status(400).json({ error: 'Enter a valid order number' });
    if (!validEmail(req.query.email)) return res.status(400).json({ error: 'Enter the email used for the order' });
    const orderId = Number(req.params.id);
    const email = normaliseEmail(req.query.email);
    try {
      const persistent = persistentOrdersEnabled() ? await getPersistentOrder(orderId) : null;
      if (persistent && persistent.email === email) {
        const tracking = buildTrackingDetails(persistent, persistent.history || []);
        return res.json({ order: { ...persistent, history: tracking.checkpoints, tracking }, persistent: true });
      }
    } catch (error) { return next(error); }
    const order = db.prepare(`SELECT o.id, o.status, o.total_cents, o.shipping_name, o.address, o.city, o.postcode, o.created_at,
      p.status AS payment_status, p.transaction_ref FROM orders o JOIN users u ON u.id = o.user_id
      LEFT JOIN payments p ON p.order_id = o.id WHERE o.id = ? AND u.email = ?`)
      .get(orderId, email);
    if (!order) return res.status(404).json({ error: 'No order matches that number and email address' });
    const items = db.prepare(`SELECT oi.quantity, p.name, v.size, v.colour FROM order_items oi
      JOIN products p ON p.id = oi.product_id JOIN variants v ON v.id = oi.variant_id
      WHERE oi.order_id = ? ORDER BY oi.id`).all(order.id);
    const history = db.prepare(`SELECT status, note, created_at FROM order_status_history
      WHERE order_id = ? ORDER BY id`).all(order.id);
    const tracking = buildTrackingDetails(order, history);
    res.json({ order: { ...order, items, history: tracking.checkpoints, tracking } });
  });

  app.post('/api/orders', async (req, res, next) => {
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
      const persistentOrderId = persistentOrdersEnabled() ? await nextPersistentOrderId() : null;
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      db.exec('BEGIN IMMEDIATE');
      const user = upsertUser(db, email, name);
      const variantQuery = db.prepare(`SELECT v.id, v.product_id, v.stock, v.size, v.colour, p.name, p.price_cents
        FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`);
      const selected = items.map(item => {
        const variant = variantQuery.get(item.variant_id);
        if (!variant) throw new Error('A selected product option no longer exists');
        if (variant.stock < item.quantity) throw new Error(`${variant.name} does not have enough stock`);
        return { ...variant, quantity: item.quantity };
      });
      const subtotal = selected.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
      const shipping = subtotal >= 8000 ? 0 : 995;
      const orderResult = persistentOrderId
        ? db.prepare(`INSERT INTO orders
          (id, user_id, subtotal_cents, shipping_cents, total_cents, shipping_name, address, city, postcode, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(persistentOrderId, user.id, subtotal, shipping, subtotal + shipping, name, address, city, postcode, createdAt)
        : db.prepare(`INSERT INTO orders
          (user_id, subtotal_cents, shipping_cents, total_cents, shipping_name, address, city, postcode, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(user.id, subtotal, shipping, subtotal + shipping, name, address, city, postcode, createdAt);
      const orderId = persistentOrderId || Number(orderResult.lastInsertRowid);
      const insertItem = db.prepare(`INSERT INTO order_items
        (order_id, product_id, variant_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)`);
      const reduceStock = db.prepare('UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const item of selected) {
        if (Number(reduceStock.run(item.quantity, item.id, item.quantity).changes) !== 1) {
          throw new Error(`${item.name} stock changed before checkout`);
        }
        insertItem.run(orderId, item.product_id, item.id, item.quantity, item.price_cents);
      }
      db.prepare('INSERT INTO order_status_history(order_id,status,note,created_at) VALUES (?, ?, ?, ?)')
        .run(orderId, 'Confirmed', 'Order received and confirmed', createdAt);
      const transactionRef = `DEMO-${orderId}-${randomUUID().slice(0, 8).toUpperCase()}`;
      db.prepare('INSERT INTO payments(order_id,status,transaction_ref,amount_cents,created_at) VALUES (?,?,?,?,?)')
        .run(orderId, 'Succeeded', transactionRef, subtotal + shipping, createdAt);
      const order = { id: orderId, status: 'Confirmed', subtotal_cents: subtotal, shipping_cents: shipping, total_cents: subtotal + shipping };
      if (persistentOrderId) {
        await savePersistentOrder({
          ...order,
          shipping_name: name,
          customer_name: name,
          email,
          address,
          city,
          postcode,
          created_at: createdAt,
          updated_at: createdAt,
          payment_status: 'Succeeded',
          transaction_ref: transactionRef,
          items: selected.map(item => ({
            product_id: item.product_id,
            variant_id: item.id,
            quantity: item.quantity,
            unit_price_cents: item.price_cents,
            name: item.name,
            size: item.size,
            colour: item.colour
          })),
          history: [{ status: 'Confirmed', note: 'Order received and confirmed', created_at: createdAt }]
        });
      }
      db.exec('COMMIT');
      let emailSent = false;
      try {
        emailSent = await sendOrderReceipt({ email, name, order, items: selected, address, city, postcode, transactionRef });
      } catch (error) {
        console.error('Order receipt email failed:', error.message);
      }
      res.status(201).json({
        order,
        payment: { status: 'Succeeded', transaction_ref: transactionRef },
        email_sent: emailSent,
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

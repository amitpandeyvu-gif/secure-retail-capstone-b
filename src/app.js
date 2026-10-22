import express from 'express';

function positiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/', (_req, res) => res.json({
    project: 'Secure Retail Product Catalogue',
    sprint: 3,
    message: 'Backend server is running. Product data is stored in SQLite.',
    endpoints: ['/api/health', '/api/categories', '/api/products', '/api/products/1', '/api/products/1/variants']
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

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error, _req, res, _next) => {
    console.error('Request failed:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

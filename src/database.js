import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const defaultDatabasePath = resolve(projectRoot, 'data/retail.db');

export function openDatabase(filename = process.env.DATABASE_PATH || defaultDatabasePath) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  try {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
    if (!exists) throw new Error('Database not initialised. Run npm run db:init first.');
    db.exec(readFileSync(resolve(projectRoot, 'database/schema.sql'), 'utf8'));
    // Keep the assessment catalogue and permanent sample tracking orders available
    // while preserving all existing customer and administrator data.
    db.exec(readFileSync(resolve(projectRoot, 'database/seed.sql'), 'utf8'));
    db.prepare("INSERT OR IGNORE INTO users(email,name) VALUES ('demo@popculture.com','Demo Customer')").run();
    const demoUser = db.prepare("SELECT id FROM users WHERE email = 'demo@popculture.com'").get();
    db.prepare('UPDATE orders SET user_id = ? WHERE id IN (1001, 1002)').run(demoUser.id);
    db.exec(`INSERT INTO order_status_history(order_id,status,note,created_at)
      SELECT o.id,o.status,'Order status recorded',o.created_at FROM orders o
      WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id)`);
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}

export function initialiseDatabase(filename = process.env.DATABASE_PATH || defaultDatabasePath) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON; BEGIN;');
  try {
    db.exec(readFileSync(resolve(projectRoot, 'database/schema.sql'), 'utf8'));
    db.exec(readFileSync(resolve(projectRoot, 'database/seed.sql'), 'utf8'));
    db.exec('COMMIT;');
    return db;
  } catch (error) {
    db.exec('ROLLBACK;');
    db.close();
    throw error;
  }
}

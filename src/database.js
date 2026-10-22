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

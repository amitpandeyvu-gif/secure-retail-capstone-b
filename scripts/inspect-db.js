import { openDatabase } from '../src/database.js';
const db = openDatabase();
for (const table of ['categories', 'products', 'variants', 'users', 'orders', 'order_items', 'order_status_history']) {
  console.log(`\n${table.toUpperCase()}`);
  console.table(db.prepare(`SELECT * FROM ${table} ORDER BY id`).all());
}
console.log('Integrity:', db.prepare('PRAGMA integrity_check').get());
console.log('Foreign key violations:', db.prepare('PRAGMA foreign_key_check').all());
db.close();

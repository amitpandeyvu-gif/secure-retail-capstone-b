import { openDatabase } from '../src/database.js';
const db = openDatabase();
for (const table of ['categories', 'products', 'variants', 'users', 'carts', 'cart_items', 'orders', 'order_items', 'order_status_history', 'payments', 'contact_messages']) {
  console.log(`\n${table.toUpperCase()}`);
  console.table(db.prepare(`SELECT * FROM ${table} ORDER BY id`).all());
}
console.log('Integrity:', db.prepare('PRAGMA integrity_check').get());
console.log('Foreign key violations:', db.prepare('PRAGMA foreign_key_check').all());
db.close();

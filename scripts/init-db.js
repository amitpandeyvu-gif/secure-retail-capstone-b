import { initialiseDatabase, defaultDatabasePath } from '../src/database.js';
const db = initialiseDatabase();
console.log(`Database ready: ${process.env.DATABASE_PATH || defaultDatabasePath}`);
for (const table of ['categories', 'products', 'variants', 'users', 'orders', 'order_items', 'order_status_history']) {
  console.log(`${table}: ${db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count} rows`);
}
db.close();

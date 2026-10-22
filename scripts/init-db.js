import { initialiseDatabase, defaultDatabasePath } from '../src/database.js';
const db = initialiseDatabase();
console.log(`Database ready: ${process.env.DATABASE_PATH || defaultDatabasePath}`);
for (const table of ['categories', 'products', 'variants']) {
  console.log(`${table}: ${db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count} rows`);
}
db.close();

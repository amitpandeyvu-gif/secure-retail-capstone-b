import { createApp } from './src/app.js';
import { openDatabase } from './src/database.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const db = openDatabase();
const app = createApp(db);
const server = app.listen(port, host, () => {
  console.log('Secure Retail Product Catalogue - Sprint 3');
  console.log(`Server running at http://${host}:${port}`);
  console.log('SQLite database connected');
});
server.on('error', (error) => {
  console.error(`Server could not start: ${error.message}`);
  db.close();
  process.exitCode = 1;
});
function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

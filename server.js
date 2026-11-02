import { existsSync } from 'node:fs';
import express from 'express';
import { createApp } from './src/app.js';
import { initialiseDatabase, openDatabase } from './src/database.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const isVercel = process.env.VERCEL === '1';
const databasePath = isVercel
  ? (process.env.DATABASE_PATH || '/tmp/pop-culture-retail.db')
  : process.env.DATABASE_PATH;
const db = isVercel && !existsSync(databasePath)
  ? initialiseDatabase(databasePath)
  : openDatabase(databasePath);
const app = createApp(db);
// Keep the framework import in this entry point so Vercel detects the Express backend.
void express;

if (!isVercel) {
  const server = app.listen(port, host, () => {
    console.log('Pop Culture Clothing Storefront');
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
}

export default app;

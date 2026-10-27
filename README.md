# Pop Culture Clothing Storefront

Full-stack clothing storefront for the Pop Culture Clothing capstone. The project
uses accessible HTML, responsive CSS and browser JavaScript with an Express 5 API
and SQLite through Node's built-in `node:sqlite` module. No separate database
service is needed.

## Run locally

Install Node.js 24 or later. In this repository folder:

```powershell
npm ci
npm run db:init
npm test
npm start
```

Open http://127.0.0.1:3000 in a browser. Stop with Ctrl+C. The storefront supports
search, category filters, sorting, product options, wishlist, shopping bag,
email sign-in, demo checkout and order history.
If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands.
The database file is `data/retail.db` (created by `db:init`, excluded from Git).
The SQL scripts and lockfile allow another developer to recreate the environment.
Run `npm run db:inspect` to inspect sample rows and database integrity.

`HOST`, `PORT` and `DATABASE_PATH` may be set as environment variables.
`.env.example` documents defaults; `.env` files are not automatically loaded.

## Routes

| Route | Result |
|---|---|
| `GET /` | Storefront application |
| `GET /api` | API overview |
| `/api/health` | Server and database health |
| `/api/categories` | Three categories |
| `/api/products` | Six products with category and total variant stock |
| `/api/products?category=2&q=hoodie` | Optional category ID and name filters |
| `/api/products/1` | One product; 404 if absent |
| `/api/products/1/variants` | Size, colour and stock for one product |
| `POST /api/auth/login` | Creates or returns a demo account from a valid email |
| `POST /api/orders` | Validates an order, stores it and reduces variant stock |
| `GET /api/orders?email=...` | Returns order history for a demo account |

All responses are JSON. `price_cents` uses AUD integer cents (2995 = AUD 29.95).
Malformed IDs/filters return 400; missing resources/routes return 404.

## Structure

```text
database/       schema.sql and fictional seed.sql
data/           generated retail.db
public/         responsive storefront HTML, CSS and JavaScript
src/            application routes and database module
scripts/        database setup, inspection and optional evidence utility
test/           database and HTTP integration tests
docs/           earlier planning and Sprint 3 implementation notes
package.json    scripts and Express dependency
server.js       backend entry point
```

## Portfolio evidence

In a separate terminal, `npm run evidence` starts a read-only local inspector at
http://127.0.0.1:3001/structure. It reads actual source files and SQLite rows;
it is separate from the product API and is for local assessment screenshots only.
Capture the real running server terminal, localhost response and your actual
Sprint 3 GitHub commits. Existing team history is not proof of a new contribution.

The email sign-in and payment selection are intentionally demonstration features.
Any valid email may be used and no password or real payment details are collected.
Orders, order items and stock updates are stored in SQLite for functional testing.

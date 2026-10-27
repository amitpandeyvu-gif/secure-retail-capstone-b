# Pop Culture Clothing Storefront

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/amitpandeyvu-gif/secure-retail-capstone-b?ref=codex%2Fsprint3-backend)
[![Backend tests](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/actions/workflows/ci.yml/badge.svg?branch=codex%2Fsprint3-backend)](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/actions/workflows/ci.yml)

Full-stack clothing storefront for the Pop Culture Clothing capstone. The project
uses accessible HTML, responsive CSS and browser JavaScript with an Express 5 API
and SQLite through Node's built-in `node:sqlite` module. No separate database
service is needed.

## Run from GitHub

Select **Open in GitHub Codespaces** above, choose **Create codespace**, and wait
for the setup to finish. The repository automatically installs its packages,
creates the SQLite database, runs the tests, starts the Node server and forwards
port 3000. Select **Open in Browser** if the storefront preview does not open
automatically. Add `/admin.html` to the forwarded website address for the admin
portal.

GitHub Pages is not used because this application requires an Express server and
a writable SQLite database. Codespaces provides the required Node environment
directly from the GitHub repository. Data remains inside that codespace and may
need to be recreated if the codespace is deleted.

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
email sign-in, demo checkout and order history. A separate administration portal
provides catalogue, inventory, order and customer management at
http://127.0.0.1:3000/admin.html.
If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands.
The database file is `data/retail.db` (created by `db:init`, excluded from Git).
The SQL scripts and lockfile allow another developer to recreate the environment.
Run `npm run db:inspect` to inspect sample rows and database integrity.

`HOST`, `PORT`, `DATABASE_PATH`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` may be set as environment variables.
`.env.example` documents defaults; `.env` files are not automatically loaded.

For local assessment demonstration, the administrator login is
`admin@popculture.com` with password `Admin123!`. Change both environment values
before sharing or deploying the application. Customer accounts remain the separate
email-only demonstration flow requested for the storefront.

## Routes

| Route | Result |
|---|---|
| `GET /` | Storefront application |
| `GET /admin.html` | Responsive administration portal |
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
| `POST /api/admin/login` | Starts an eight-hour in-memory administrator session |
| `GET /api/admin/dashboard` | Summary totals, latest orders and low stock |
| `GET/POST/PUT/DELETE /api/admin/products...` | Protected catalogue management |
| `PATCH /api/admin/variants/:id` | Protected stock update |
| `GET/PATCH /api/admin/orders...` | Protected order and fulfilment management |
| `GET /api/admin/customers` | Protected customer summary |

All responses are JSON. `price_cents` uses AUD integer cents (2995 = AUD 29.95).
Malformed IDs/filters return 400; missing resources/routes return 404.

## Structure

```text
database/       schema.sql and fictional seed.sql
data/           generated retail.db
public/         responsive customer storefront and administration portal
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

The customer email sign-in and payment selection are intentionally demonstration features.
Any valid email may be used and no password or real payment details are collected.
Orders, order items and stock updates are stored in SQLite for functional testing.
The admin session is separate, password-protected and held in server memory; use a
managed identity provider and persistent secure sessions before production use.

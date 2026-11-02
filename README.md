# Pop Culture Clothing Storefront

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/amitpandeyvu-gif/secure-retail-capstone-b?ref=codex%2Fsprint3-backend)
[![Backend tests](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/actions/workflows/ci.yml/badge.svg?branch=codex%2Fsprint3-backend)](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/actions/workflows/ci.yml)
[![Live on Vercel](https://img.shields.io/badge/Vercel-Live-000000?logo=vercel)](https://pop-culture-clothing-capstone.vercel.app)

Full-stack clothing storefront for the Pop Culture Clothing capstone. The project
uses accessible HTML, responsive CSS and browser JavaScript with an Express 5 API,
SQLite through Node's built-in `node:sqlite` module and Upstash Redis for durable
hosted customer orders.

## Live deployment

**Storefront:** https://pop-culture-clothing-capstone.vercel.app  
**Unified sign in:** https://pop-culture-clothing-capstone.vercel.app/login.html
**Administration:** https://pop-culture-clothing-capstone.vercel.app/admin.html

The repository is configured for Vercel's Node.js runtime. Vercel serves the
responsive pages from `public/` and runs the exported Express application for the
API. The hosted assessment demonstration initialises the catalogue in SQLite and
stores completed orders, payment references and tracking history in shared Upstash
storage. Customer orders therefore remain visible in both order history and the
administrator portal across serverless restarts. Local and Codespaces runs keep
their SQLite data in `data/retail.db` and use Upstash when its environment values
are available.

Production customer access uses Google Identity Services. Google verifies the
account and the backend validates the signed ID token before creating or returning
the local customer record. The application never receives a Google password.

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
Google sign-in when configured, demo checkout, order history and order tracking. A separate administration portal
provides catalogue, inventory, order and customer management at
http://127.0.0.1:3000/admin.html.

## Capstone B functional coverage

| Requirement | Implementation |
|---|---|
| Product catalogue | Twenty products across T-Shirts, Shirts, Pants, Hoodies, Caps/Bags and Shoes |
| Customer access | Optional verified Google sign-in, guest checkout and an email-only local fallback |
| Shopping cart | Local cart for guests and a persistent SQLite cart after sign-in |
| Checkout | Guest-friendly validated delivery details, confirmation screen, server totals and transactional stock reduction |
| Payments | Safe fictional payment record with status, amount and unique reference; no card data |
| Orders | Durable hosted checkout history, two fictional sample orders, item details and administrator fulfilment controls |
| Tracking | Email-verified timeline with status history and payment confirmation |
| Administration | Dashboard, product CRUD, variant CRUD, stock, orders, customers, payments and support |
| Customer information | About, Contact, Delivery, Returns and Sizing pages |
| Support | Contact form stored in SQLite with New and Resolved administration states |
If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands.
The database file is `data/retail.db` (created by `db:init`, excluded from Git).
The SQL scripts and lockfile allow another developer to recreate the environment.
Run `npm run db:inspect` to inspect sample rows and database integrity.

`HOST`, `PORT`, `DATABASE_PATH`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`, `KV_REST_API_URL` and `KV_REST_API_TOKEN` may be set as
environment variables. The two `KV_` values are provisioned automatically by the
Vercel Upstash integration.
`.env.example` documents defaults; `.env` files are not automatically loaded.

For local assessment demonstration, the administrator login is
`admin@gmail.com` with password `admin@123`. Change both environment values
before sharing or deploying the application. Customer accounts use verified Google
sign-in in the hosted deployment. Local development keeps an email-only fallback
when `GOOGLE_CLIENT_ID` is not set.

## Routes

| Route | Result |
|---|---|
| `GET /` | Storefront application |
| `GET /admin.html` | Responsive administration portal |
| `GET /login.html` | Unified customer Google sign-in and administrator login page |
| `GET /about.html` | Store and project information |
| `GET /contact.html` | Database-backed customer contact form |
| `GET /help.html` | Delivery, returns, sizing and payment information |
| `GET /privacy.html` | Privacy information for account and order data |
| `GET /terms.html` | Demonstration storefront terms of use |
| `GET /api` | API overview |
| `/api/health` | Server and database health |
| `/api/categories` | Six clothing departments |
| `/api/products` | Twenty products, ordered by department, with total variant stock |
| `/api/products?category=2&q=hoodie` | Optional category ID and name filters |
| `/api/products/1` | One product; 404 if absent |
| `/api/products/1/variants` | Size, colour and stock for one product |
| `GET /api/auth/config` | Reports whether Google sign-in and email notification are configured |
| `POST /api/auth/google` | Verifies a Google ID token and creates or returns the customer |
| `POST /api/auth/login` | Local-only fallback that creates or returns a demo account |
| `GET/PUT /api/cart` | Loads or synchronises a signed-in customer's persistent cart |
| `POST /api/orders` | Validates an order, stores it and reduces variant stock |
| `GET /api/orders?email=...` | Returns order history for a demo account |
| `GET /api/orders/:id/tracking?email=...` | Returns verified order progress and status history |
| `POST /api/contact` | Validates and stores a customer support message |
| `POST /api/admin/login` | Starts an eight-hour in-memory administrator session |
| `GET /api/admin/dashboard` | Summary totals, latest orders and low stock |
| `GET/POST/PUT/DELETE /api/admin/products...` | Protected catalogue management |
| `PATCH /api/admin/variants/:id` | Protected stock update |
| `GET/PATCH /api/admin/orders...` | Protected order and fulfilment management |
| `GET /api/admin/customers` | Protected customer summary |
| `POST/DELETE /api/admin/.../variants` | Protected size and colour option management |
| `GET /api/admin/payments` | Protected fictional payment records |
| `GET/PATCH /api/admin/messages...` | Protected customer support workflow |

All responses are JSON. `price_cents` uses AUD integer cents (2995 = AUD 29.95).
Malformed IDs/filters return 400; missing resources/routes return 404.

## Structure

```text
database/       schema.sql and fictional seed.sql for catalogue, cart, order, payment and support data
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

Customer sign-in supports Google Identity Services when `GOOGLE_CLIENT_ID` is
configured. The server verifies Google's signed ID token before creating the local
customer record. When `RESEND_API_KEY` and a verified `EMAIL_FROM` sender are set,
the customer receives a sign-in notification and a professional itemised receipt
after placing an order. The receipt includes subtotal, shipping, total, delivery
details, payment reference and a direct tracking link. `EMAIL_REPLY_TO` is optional,
and `PUBLIC_APP_URL` controls the tracking link. Email failure never prevents sign-in
or checkout. Without Google configuration, local development retains the email-only
assessment demonstration. No passwords or real payment details are collected.
Orders, payment references and tracking history use shared Upstash storage in the
hosted deployment; SQLite remains the local functional-test and catalogue database.
The admin session is separate, password-protected and held in server memory; use a
managed identity provider and persistent secure sessions before production use.

## Integrated assessment evidence

The final branch also retains the earlier React catalogue, Sprint 4 API exercise,
Postman collection, database screenshots, final presentation and team evidence from
`main`. These remain as assessment artefacts; the deployed Express application at the
production URL is the canonical runnable storefront.

# Sprint 3 implementation and Week 8 plan

## Scope and relationship to earlier work

The repository planning documents describe a Pop Culture Clothing catalogue
and propose Node.js/Express, persistent product data, categories, prices and
stock per size and colour. This sprint implements that catalogue foundation.
No Week 4 schema was present in the supplied repository; the three-table schema
is a proposed implementation and should be reconciled with any separate team ERD.

## Database design

`categories` has many `products`; `products` has many `variants`.
Each table has an integer primary key. Products reference a category, and
variants reference a product. Product SKUs and category names are unique.
The combination of product, size and colour is unique. Foreign keys are enabled
on each connection; STRICT tables and CHECK constraints reject fractional cents,
negative prices and negative stock. Prices are stored as integer AUD cents:
2995 means AUD 29.95. Stock is stored per variant and summed for product output.

The seed has 3 categories, 6 fictional products and 11 variants. One variant
has zero stock so the next sprint can test out-of-stock behaviour. The seed
uses fixed IDs and INSERT OR IGNORE so rerunning it preserves existing rows.
It is a development seed, not a production migration or reset mechanism.

## Backend structure and data flow

`server.js` opens the database and starts Express. `src/app.js` defines HTTP
routes; `src/database.js` handles database initialisation and connections.
`database/schema.sql` and `database/seed.sql` are reproducible database sources.
Browser -> GET route -> parameterised SQLite query -> JSON response.

The server checks route IDs and filters. It uses bound query parameters;
client input is never concatenated into SQL. Product APIs do not expose customer
records. Write, admin, login and checkout endpoints are intentionally not
implemented yet. This is a local Sprint 3 demonstration, not a complete secure
retail application. The optional evidence inspector runs separately on port
3001 and must remain local; it displays source files and database details.

## Verification

On 22 October 2026, both automated test groups passed: database constraints and
HTTP integration. Tests use an in-memory database and an ephemeral HTTP port.
They cover row counts, foreign keys, uniqueness, integer money, negative stock,
search, category filters, variant rows, database-driven stock changes, invalid
input, missing products, SQL injection-shaped search text and unsupported writes.
The on-disk database integrity check returned `ok` with no foreign key violations.

## Week 8 activities

1. Confirm schema against the team's Week 4 ERD and connect the Capstone A frontend
   to product, category and variant APIs; display AUD prices and stock correctly.
2. Design accounts with salted password hashing, expiring sessions and server-side
   role checks before implementing any admin write endpoints.
3. Add validated product writes behind admin permissions and meaningful tests.
4. Design carts and orders with transactional stock checks and server-calculated
   totals before checkout; do not trust frontend price or payment status.
5. Add product images, delivery/returns information and later reviews/promotions
   as agreed with the team. Add migrations before extending the schema.
6. Review, commit and push Sprint 3 changes from Amit's own account and capture
   the real commit history and personal contribution evidence.

## Assistance and attribution

This implementation and its technical documentation were prepared with Codex
assistance. Existing planning files retain their original authorship. Amit must
review, understand and adapt this work, describe his own contribution accurately,
and follow the course's rules on declaring assistance. No personal learning
experience or Sprint 3 GitHub contribution is asserted on his behalf.

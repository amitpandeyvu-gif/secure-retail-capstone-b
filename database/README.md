# Pop Culture Clothing — Sprint 3 Database

## Files

- popculture.db: populated SQLite database.
- schema.sql: nine tables, constraints, indexes and three readable views.
- sample-data.sql: catalogue and demonstration records.
- screenshots/: database evidence folder.

## Database creation

The database was created by executing schema.sql followed by sample-data.sql in a blank SQLite database. The included popculture.db already contains these records.

## Backend

From the backend directory:

```bash
npm install
npm start
```

Endpoints: GET /, GET /api/products, GET /api/categories. The backend reads database/popculture.db.

## Product names

Product names appear in products.name and order_items.item_name. The product_catalogue, cart_item_details and order_item_details views show readable item names alongside prices and quantities.

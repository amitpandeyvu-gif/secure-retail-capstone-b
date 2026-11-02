# Sprint 4 Live Demonstration Script

Target duration: 4 minutes

## 1. Start and verify the system

```powershell
npm install
npm run dev
```

Open `http://localhost:5173` and briefly show the customer storefront. Explain that the frontend requests `/api/products`, Express queries SQLite, and the returned JSON becomes the catalogue displayed on screen.

## 2. Demonstrate Read

Open **Shop**, apply one category filter, and open a product. Point out that the product name, price, description, sizes and colours came from the database.

## 3. Demonstrate Create

Open **Admin Portal** and sign in with:

- Email: `amit@popculture.com`
- Password: `amit123`

Open **Products**, select **Add Product**, enter a clearly named demonstration product, and save it. Show that the record appears in the admin table and customer catalogue.

## 4. Demonstrate Update

Edit the demonstration product. Change its name or price, save, and show the updated value in the table.

## 5. Demonstrate Delete

Delete the same demonstration product. Confirm that it disappears from the database-backed product list.

## 6. Show repeatable test evidence

Run:

```powershell
npm test
```

Highlight the passing validation, Create, Read, Update, Delete and HTTP 404 checks. Use only the temporary demonstration record so the prepared catalogue remains unchanged.

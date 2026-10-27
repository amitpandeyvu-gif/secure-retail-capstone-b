# Secure Retail Capstone B

This repository contains the final full-stack Pop Culture Clothing website. It combines the React catalogue frontend with the Sprint 3 Express API and SQLite product database.

## Features

- Responsive customer storefront, product catalogue, search and filters
- Product details, wishlist, persistent customer cart and database-backed checkout
- Secure customer registration, sign-in, sign-out and session restoration
- Administrator dashboard with database-backed product CRUD operations
- Customer order history and administrator order-status management
- Seeded showcase data for 15 named customers and realistic purchases
- Express API backed by SQLite
- Production server that serves both the API and the compiled frontend
- Built-in catalogue fallback if the API is temporarily unavailable

## Technology

- React 18, TypeScript, Vite and Tailwind CSS
- Express 5
- SQLite 3

## Run locally

Install dependencies:

```powershell
npm install
```

Start the frontend and backend together:

```powershell
npm run dev
```

Open `http://localhost:5173`. The Vite development server forwards `/api` requests to the backend on port 3000.

## Production build

```powershell
npm run build
npm start
```

Open `http://localhost:3000`. Express serves the compiled website and API from the same server.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server and database health |
| GET | `/api/products` | Products with category, sizes and colours |
| GET | `/api/products/:id` | One product by ID |
| POST | `/api/products` | Create a validated product and its variants |
| PUT | `/api/products/:id` | Update a product and its variants |
| DELETE | `/api/products/:id` | Delete an unused product |
| GET | `/api/categories` | Product categories |
| POST | `/api/auth/register` | Create and sign in a customer account |
| POST | `/api/auth/login` | Sign in and create an HTTP-only session |
| POST | `/api/auth/logout` | End the current session |
| GET | `/api/auth/me` | Restore the signed-in user |
| GET/POST | `/api/cart`, `/api/cart/items` | Read and add persistent cart items |
| PATCH/DELETE | `/api/cart/items/:id` | Change quantity or remove a cart item |
| POST | `/api/orders` | Validate stock and place an order |
| GET | `/api/orders` | Signed-in customer order history |
| GET | `/api/admin/orders` | Administrator order management |
| PATCH | `/api/admin/orders/:id/status` | Administrator order status update |

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `customer@popculture.com` | `customer123` |
| Administrator | `amit@popculture.com` | `amit1234` |

These seeded credentials are for the capstone demonstration. Passwords are hashed with scrypt, sessions use random HTTP-only cookies, and administrator routes enforce role checks. The checkout uses a clearly labelled simulated payment and never sends card details to the server.

The database also includes 15 showcase customers. Examples include Amit Kumar purchasing jeans and a T-shirt, Sujal Sharma purchasing tailored pants, and Manoj Thapa purchasing sneakers. Their orders appear in the administrator Order Management page.

## Project structure

```text
backend/        Express server
database/       SQLite database, schema and sample data
postman/        API test collection
public/         Static frontend assets
src/            React application
docs/           Capstone research and analysis
```

## Verification

Run the complete syntax and production-build check:

```powershell
npm run check
```

Run the complete build and automated CRUD integration test:

```powershell
npm test
```

The automated test uses an isolated database copy and verifies registration, login, session restoration, role-protected product CRUD, persistent cart operations, stock-checked checkout, customer order history, administrator order visibility/status updates, and logout.

# Secure Retail Capstone B

This repository contains the final full-stack Pop Culture Clothing website. It combines the React catalogue frontend with the Sprint 3 Express API and SQLite product database.

## Features

- Responsive customer storefront, product catalogue, search and filters
- Product details, wishlist, cart and checkout prototype
- Customer and administrator sign-in flows
- Administrator dashboard for products, categories, orders, customers and inventory
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
| GET | `/api/categories` | Product categories |

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `customer@popculture.com` | `customer123` |
| Administrator | `amit@popculture.com` | `amit123` |

These credentials are for the capstone prototype only and are not production authentication.

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

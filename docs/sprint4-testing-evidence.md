# Sprint 4 Testing Evidence

Test date: 26 October 2026  
Environment: Node.js, Express 5, SQLite 3 and the production Vite build

## Automated command

```powershell
npm test
```

## Recorded results

| Area | Expected result | Actual result | Status |
|---|---|---|---|
| Build | React production bundle compiles | 2,217 modules transformed and the build completed | Pass |
| Validation | Incomplete product with negative price is rejected | HTTP 400 with validation details | Pass |
| Create | Valid product is stored | HTTP 201 and a database product ID | Pass |
| Read | Created product is returned | HTTP 200 with matching product name | Pass |
| Update | Product name and price change | HTTP 200 with the updated values | Pass |
| Delete | Temporary product is removed | HTTP 204 | Pass |
| Delete verification | Removed product cannot be retrieved | HTTP 404 | Pass |
| Error handling | Unknown product is handled safely | Structured JSON error response | Pass |

## Test output

```text
PASS: validation rejects incomplete product data with HTTP 400
PASS: Create returns HTTP 201
PASS: Create returns the database product ID
PASS: Read returns the created product
PASS: Update returns HTTP 200
PASS: Update persists the new name and price
PASS: Delete returns HTTP 204
PASS: Deleted product returns HTTP 404
CRUD integration test completed successfully.
```

## Manual checks

- The production server returned the React application with HTTP 200.
- `/api/health` reported `ok` and `database: connected`.
- `/api/products` returned 18 catalogue products.
- `/api/categories` returned 6 categories.
- The admin product form sends create and update requests to the API.
- Product deletion sends a delete request and refreshes the catalogue from SQLite.

## Evidence files

- `tests/api-crud-test.mjs` contains the repeatable CRUD and validation test.
- `backend/screenshots/products-api-response.jpg` shows the database response in the browser.
- `backend/screenshots/server-running.jpg` shows the backend running.
- `docs/screenshots/storefront-home.png` shows the completed storefront.

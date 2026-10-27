# Pop Culture Clothing storefront

## Implemented customer journey

The storefront provides a responsive shopping experience backed by the existing
Express and SQLite application. Customers can browse the live product catalogue,
search and filter products, sort results, choose a size and colour, save favourites,
manage bag quantities and complete a demonstration checkout.
Customers can also track an order using its order number and checkout email. The
tracking view shows Confirmed, Packed, Shipped and Delivered stages, item details
and status timestamps recorded when an administrator changes fulfilment status.

Any valid email address can be used to create or reopen a demonstration account.
The account view shows orders placed with that email. This is intentionally a
password-free assessment feature, not production authentication.

## Data and order behaviour

Products, categories, variants and stock are read from SQLite. Checkout validates
delivery fields, product options, quantities and current stock. A successful order
creates an order and its line items in one transaction, then reduces variant stock.
Free shipping applies when the subtotal is at least AUD 80; otherwise shipping is
AUD 9.95.

Guest bags use browser storage. After email sign-in, the bag is synchronised with
`carts` and `cart_items` in SQLite, so it can be recovered from the same account.
Checkout also creates a fictional `payments` record with a unique demonstration
reference and never requests or stores card details.

The checkout does not collect card numbers or process money. It records a simulated
confirmed order so the complete storefront flow can be demonstrated safely.

## Verification

- Node tests cover database constraints, product endpoints, email sign-in, order
  creation, order history and stock reduction.
- Automated browser checks cover desktop and mobile rendering, product loading,
  email sign-in, product option selection and adding an item to the bag.
- The interface includes keyboard focus support, labels, semantic page regions and
  reduced-motion support.

## Administration side

The customer store and administration portal use the same Express service and
SQLite database. The protected `/admin.html` portal includes summary metrics,
low-stock alerts, recent order activity, product creation and editing, live stock
updates, fulfilment status controls and customer summaries. Administrator API
requests require a short-lived bearer token returned by the separate admin login.
Every fulfilment change creates a database history record that is shown immediately
in the customer tracking timeline.

Administrators can create and edit products, add and remove size and colour
options, change stock, review fictional payments, and resolve messages submitted
through the customer Contact page. The About and Help pages complete the earlier
frontend navigation and explain delivery, returns, sizing and safe payments.

The default local assessment credentials are documented in `.env.example` and can
be replaced through `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.
Changing catalogue or stock information in the portal changes what the customer
store receives from its API.

## Production improvements

Before public deployment, replace the email-only demonstration login with verified
authentication, connect a compliant payment provider, persist administrator sessions,
rate limiting, CSRF protection, role-based access, delivery integrations and
formal accessibility and security testing.

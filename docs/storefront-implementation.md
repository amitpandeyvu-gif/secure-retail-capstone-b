# Pop Culture Clothing storefront

## Implemented customer journey

The storefront provides a responsive shopping experience backed by the existing
Express and SQLite application. Customers can browse the live product catalogue,
search and filter products, sort results, choose a size and colour, save favourites,
manage bag quantities and complete a demonstration checkout.
Checkout works for guests as well as signed-in customers. After a successful order,
the customer receives a confirmation screen with direct links to order history and
tracking. The account view also provides a clearly labelled sample history with two
fictional orders for assessment demonstration.
Customers can also track an order using its order number and checkout email. The
tracking view shows Confirmed, Packed, Shipped and Delivered stages, item details
and status timestamps recorded when an administrator changes fulfilment status.

The hosted storefront uses Google Identity Services. Google verifies the customer,
the Express backend validates the signed ID token and the local customer record is
created or reopened using the verified email address. The website never receives
the customer's Google password. Local development retains an email-only fallback
when a Google client ID is not configured.

## Data and order behaviour

Products, categories, variants and stock are read from SQLite. Checkout validates
delivery fields, product options, quantities and current stock. A successful order
creates an order and its line items in one transaction, then reduces variant stock.
Free shipping applies when the subtotal is at least AUD 80; otherwise shipping is
AUD 9.95.

Guest bags use browser storage. After customer sign-in, the bag is synchronised with
`carts` and `cart_items` in SQLite, so it can be recovered from the same account.
Checkout also creates a fictional `payments` record with a unique demonstration
reference and never requests or stores card details.

The checkout does not collect card numbers or process money. It records a simulated
confirmed order so the complete storefront flow can be demonstrated safely.

## Verification

- Node tests cover database constraints, product endpoints, authentication, order
  creation, order history and stock reduction.
- Automated browser checks cover desktop and mobile rendering, product loading,
  account access, product option selection and adding an item to the bag.
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

Google customer authentication is enabled on the hosted deployment. Before using
the project as a real store, connect a compliant payment provider, use persistent
administrator sessions, add rate limiting, CSRF protection, role-based access,
transactional email, delivery integrations and formal accessibility and security
testing.

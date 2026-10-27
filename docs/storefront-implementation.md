# Pop Culture Clothing storefront

## Implemented customer journey

The storefront provides a responsive shopping experience backed by the existing
Express and SQLite application. Customers can browse the live product catalogue,
search and filter products, sort results, choose a size and colour, save favourites,
manage bag quantities and complete a demonstration checkout.

Any valid email address can be used to create or reopen a demonstration account.
The account view shows orders placed with that email. This is intentionally a
password-free assessment feature, not production authentication.

## Data and order behaviour

Products, categories, variants and stock are read from SQLite. Checkout validates
delivery fields, product options, quantities and current stock. A successful order
creates an order and its line items in one transaction, then reduces variant stock.
Free shipping applies when the subtotal is at least AUD 80; otherwise shipping is
AUD 9.95.

The checkout does not collect card numbers or process money. It records a simulated
confirmed order so the complete storefront flow can be demonstrated safely.

## Verification

- Node tests cover database constraints, product endpoints, email sign-in, order
  creation, order history and stock reduction.
- Automated browser checks cover desktop and mobile rendering, product loading,
  email sign-in, product option selection and adding an item to the bag.
- The interface includes keyboard focus support, labels, semantic page regions and
  reduced-motion support.

## Production improvements

Before public deployment, replace the email-only demonstration login with verified
authentication, connect a compliant payment provider, add server-managed sessions,
rate limiting, CSRF protection, inventory administration, delivery integrations and
formal accessibility and security testing.

# Version 2 priorities

These priorities come from the product-data investigation, gap analysis and user
research. They keep the next release focused on customer value, reliable data and
security.

| Priority | Improvement | Reason and frontend impact |
|---|---|---|
| High | Persistent hosted database | Orders, inventory, carts and tracking must survive serverless restarts. The storefront and admin portal will show reliable shared data. |
| High | Production payment provider | Replace the fictional payment record with a compliant checkout and clear success or failure states. |
| High | Strong administrator authentication | Replace the demonstration admin password and in-memory token with managed identity, roles and persistent secure sessions. |
| High | Transactional order email | Send verified order confirmation and status notifications through an approved mail provider. |
| Medium | Product reviews and ratings | Add useful social proof to product cards and product details, with moderation in the admin portal. |
| Medium | Improved product media | Store multiple optimised images and alt text for every product and variant. |
| Medium | Delivery estimates | Display postcode-aware estimates during checkout and in order tracking. |
| Low | Personalised recommendations | Use browsing and order history only after consent and sufficient data are available. |
| Low | Loyalty rewards | Add points and rewards after the core purchase and fulfilment workflow is production-ready. |

## Recommended delivery order

1. Move production data to a persistent managed database and migrate the current schema.
2. Harden administrator access and complete security testing.
3. Add compliant payments and transactional order email.
4. Improve product media, delivery estimates and review features.
5. Consider personalisation and loyalty after privacy and analytics requirements are agreed.

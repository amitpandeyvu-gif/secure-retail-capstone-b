# GitHub collaboration evidence

GitHub is the shared source of truth for code, documentation and review. Work is
developed on a feature branch, checked automatically and presented through a pull
request before integration.

| Evidence | Repository location |
|---|---|
| Feature branch | `codex/sprint3-backend` |
| Pull request | [PR #8 — Sprint 3 backend, storefront and admin system](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/pull/8) |
| Automated checks | [Backend tests workflow](https://github.com/amitpandeyvu-gif/secure-retail-capstone-b/actions/workflows/ci.yml) |
| Live deployment | [Pop Culture Clothing](https://pop-culture-clothing-capstone.vercel.app) |
| Admin evidence | [Administration portal](https://pop-culture-clothing-capstone.vercel.app/admin.html) |
| API evidence | [Products endpoint](https://pop-culture-clothing-capstone.vercel.app/api/products) |

## Working process

1. Requirements and data findings are recorded as issues and project documents.
2. Implementation changes are committed with a focused description on the feature branch.
3. Every push runs the Node integration tests through GitHub Actions.
4. Pull-request review records feedback and keeps the discussion visible.
5. Vercel provides a testable version of the storefront, API and admin portal.

No secrets are committed. Local values are documented in `.env.example`, while
hosted credentials and provider configuration are stored as deployment environment
variables.

# Production readiness notes

This project has been cleaned and hardened from the uploaded prototype, but it is not a complete production ecommerce platform until the remaining platform integrations are completed.

## What was fixed in this package

- Removed duplicate TypeScript context/page backup files that were part of the compile surface.
- Rewrote the cart context with safer localStorage hydration, quantity clamping, memoized handlers, and no customer billing/card data in global state.
- Reworked checkout so the app does not collect raw card numbers or CVVs. Card payment must be delegated to a PCI-compliant payment provider.
- Rebuilt the dynamic artwork page to avoid broken `params`/`useEffect` typing and missing imports.
- Rebuilt the collection detail route so `/collections/1`, `/collections/2`, etc. match the collection listing.
- Rebuilt the admin dashboard file because it had malformed JSX.
- Removed role-based mock login routing and admin/staff self-selection from signup.
- Added middleware to block `/admin` and `/staff` unless an auth layer sets a `galeria_session_role` cookie to `admin` or `staff`.
- Protected database setup/seed API routes with `DB_ADMIN_TOKEN` through an `x-db-admin-token` header.
- Removed exposed environment logging from database setup/seed routes.
- Added security headers and image remote-pattern config in `next.config.mjs`.
- Removed `v0.app` metadata generator leakage.
- Added `.env.example`.
- Added `type-check` script and made `lint` run TypeScript checking instead of calling an unconfigured ESLint binary.

## Still required before real production launch

1. Wire a real authentication provider and have it issue server-verified admin/staff roles. The current middleware expects an auth system to set `galeria_session_role`.
2. Replace mock product/order/customer data with database-backed API routes or server actions.
3. Integrate a real payment provider such as PayMongo, Stripe, Adyen, or a bank checkout flow. Do not collect raw card numbers or CVVs in React state.
4. Add inventory reservation and order lifecycle logic on the server to prevent overselling.
5. Add transactional emails for order confirmation, payment links, shipment updates, and admin alerts.
6. Add automated tests for cart totals, checkout requests, admin route protection, and DB mutation authorization.
7. Run dependency installation and `npm run build` in the actual deployment environment. This review environment could parse-check the files but could not complete dependency installation in time.

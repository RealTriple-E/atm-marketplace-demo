# ATM Live — Dedicated Multi-User Backend Foundation

Status: **code complete on feature branch; dedicated Supabase project NOT yet provisioned; migrations NOT applied to a hosted database; payments NOT enabled.**

ATM's original GitHub Pages rental marketplace remains an interactive browser-only **demo**. A separate page, `live.html`, hosts the authenticated multi-user **beta foundation**. It is intentionally disabled until a dedicated ATM Supabase project is configured. **Never connect ATM to either Kora Central or Kora Business.**

## What has been implemented

| Domain | Implementation | Control |
|---|---|---|
| Buyer and seller identities | Supabase Auth, separate public seller profile with required HTTPS portrait, same user ID and session | Server-side Auth / RLS |
| Buyer/seller mode switch | Client view preference, no privilege elevation | Database checks seller ownership independently |
| Listings | Authenticated RPC creation, server-set seller owner, all six broad categories, 1–10 HTTPS image references | Only seller may create through RPC |
| Price negotiations | Fixed or negotiable mode, seller-controlled toggle, offers and counters | Seller/user ID and allowed state checked by RPC |
| Auctions | Server timestamps, rental period, bid increments, hidden reserve, 1–168h auction duration | PostgreSQL transaction |
| Concurrent bids | `SELECT ... FOR UPDATE` lock, idempotency UUID, per-user rate limit, min/increment checks, no owner bids | Private table + SECURITY DEFINER checks |
| Public activity | Bid alias and amount only, no bidder UUID in public projection | Explicit SELECT grants / RLS |
| Perks | Up to three seller-configured thresholds, qualifying rewards frozen at settlement | Server-calculated booking snapshot |
| Auction ending | User-triggered settlement RPC plus optional `pg_cron` settlement every minute | Locked database transaction |
| Winning booking | Payment-pending booking for highest bid that meets reserve | RLS: only buyer/seller can read |
| Payment confirmation | Idempotent server-only payment confirmation function | Restricted to `service_role`, provider signature verification must be added |
| Messaging | Booking messages after `paid` status only | Database-level RLS INSERT and SELECT |
| Live updates | Supabase Postgres Changes + periodic refresh fallback | Publishes only auctions and masked bid feed |
| CI regression | PostgreSQL 17 service, fake Auth roles, migration and role tests | GitHub Actions |

## Dedicated project activation (not yet performed)

1. Create a **new** Supabase project for ATM in the organisation and region you explicitly choose. Do not touch the two Kora projects. Review the project's monthly cost before creation.
2. Enable **email/password authentication**, set your site URL to `https://realtriple-e.github.io/atm-marketplace-demo/live.html`, and allow its redirect URL under Supabase Auth configuration. Set up appropriate mail delivery and confirmation handling.
3. In the new dedicated ATM database, run migrations in this order:
   - `supabase/migrations/202611220001_atm_live_schema.sql`
   - `supabase/migrations/202611220002_atm_marketplace_rpcs.sql`
4. Check the Supabase Data API exposure settings. Since late 2026, tables may not be exposed automatically. The migration grants needed permissions, but you must confirm Data API access for the dedicated project's `public` schema. Do not expose the `atm_private` schema.
5. Run Supabase's RLS/security/performance advisors. Verify all policies, functions and grants, especially `atm_confirm_payment`.
6. Optionally enable **Supabase Cron**, then run `supabase/optional/atm_cron_setup.sql` and activate the one-minute job described at the end of that file. Without this job, settlement also happens when a signed-in user visits an expired auction and requests finalisation; do not rely on client visits for reliable production settlement.
7. In `atm-live-config.js`, set ONLY the new ATM URL and **publishable** key:
   ```js
   window.ATM_LIVE_CONFIG = {
     url: "https://YOUR-ATM-PROJECT.supabase.co",
     publishableKey: "sb_publishable_YOUR_PUBLIC_KEY"
   };
   ```
   Never put a service-role key, secret key, database password, or Kora project reference in any browser file.
8. Deploy this configuration with GitHub Pages only after the hosted security smoke tests pass. The original ATM demo is unaffected by an unconfigured beta.
9. Test with two separate authenticated accounts on two devices, a seller-owned auction, bid increments, near-deadline bid extension, reserve met/unmet, settlement, and private winner booking access.
10. Integrate an actual mobile-money/card provider **server-side**, validate provider signatures and callback IDs, then call `atm_confirm_payment` using a server-held service credential. Until that is finished, the Live UI shows payment pending. **Never simulate a verified payment in production.**

## Test commands

Run the dependency-free existing frontend checks:

```sh
node --check atm-live.js
node --check app.js
node --test tests/auction-model.test.cjs
```

GitHub Actions runs `.github/workflows/atm-checks.yml` on branches and pull requests, including a fresh PostgreSQL 17 service with:

```sh
psql -v ON_ERROR_STOP=1 -f tests/db/bootstrap.sql
psql -v ON_ERROR_STOP=1 -f supabase/migrations/202611220001_atm_live_schema.sql
psql -v ON_ERROR_STOP=1 -f supabase/migrations/202611220002_atm_marketplace_rpcs.sql
psql -v ON_ERROR_STOP=1 -f tests/db/atm-live-integrations.sql
```

A local stub of `auth.uid()` is used **only in CI**. This is not a substitute for running hosted Supabase Auth and Realtime tests before accepting real customer transactions.

## Important boundaries and remaining work

- Real payment gateways, refunds, deposits being returned, and payment-webhook verification are not yet connected.
- Full public moderation, identity/ownership verification, fraud/shill-bidding detection, IP/device rate limiting, dispute handling, audit dashboards, spam prevention, shipping zones and seller reputation still need development.
- Authenticated users can log in, create seller profiles, publish listings, bid and see private records **once their dedicated Supabase database is configured**. The beta deliberately does not mix data with the original fictional demo.
- A production auction should be settled by the server-side scheduler, not by trusting a browser timer.
- SQL functions with `SECURITY DEFINER` are deliberately limited to fixed search paths, explicit ownership checks and restricted EXECUTE privileges. Do not loosen policies to work around permission errors.
- The existing ATM demo's **circular categories, swipeable photo galleries, seller portraits and payment-gated chat** remain unchanged.

## Reference documentation

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Supabase 2026 changelog](https://supabase.com/changelog?types=breaking-change)

# Premium Apps by Hyarax — Product Requirements Document

Status: canonical MVP scope  
Product URL: `https://apps.hyarax.works`  
Repository: `https://github.com/hyaraxco/premium-apps-store`  
Owner: `hyaraxco`

## 1. Product Summary

Premium Apps by Hyarax is an Indonesian storefront for purchasing digital application subscriptions. Buyers browse real inventory, choose duration and quantity, place a guest order, pay through BCA, SeaBank, or amount-bound QRIS, then receive access through an invite link or seller-provided credentials.

Store operator uses a protected admin panel to manage products, stock, orders, payment confirmation, fulfillment, and storefront settings.

## 2. Problem

Current sales operations originate from a chat bot and require manual product discovery, pricing, stock checks, payment confirmation, and fulfillment. This causes:

- Repeated buyer questions about price, duration, stock, and warranty.
- Manual order transcription and payment reconciliation.
- No durable buyer-facing order status.
- No single operational interface for stock and fulfillment.
- Risk of inconsistent prices and terms between bot, storefront, and admin operations.

## 3. Users

### Buyer

- Browses subscriptions without creating an account.
- Chooses duration, variant, and quantity.
- Checks stock, fulfillment type, terms, and warranty.
- Pays through BCA, SeaBank, or QRIS.
- Tracks order and contacts support through WhatsApp.
- Receives invite link or credentials by email after fulfillment.

### Store Operator

- Authenticates as admin.
- Maintains catalog, variants, prices, and stock.
- Reviews pending orders and verifies payment manually.
- Sends invite links or credentials.
- Manages bank, QRIS, WhatsApp, and maintenance settings.

## 4. Goals

1. Replace bot-only ordering with a trustworthy mobile-first storefront.
2. Keep catalog price, duration, terms, warranty, and stock in one database.
3. Support guest checkout without customer-account complexity.
4. Make manual payment and fulfillment operations traceable.
5. Deploy from GitHub to Vercel under `apps.hyarax.works`.

## 5. MVP Scope

### 5.1 Catalog

- Database-backed product and variant listing.
- Search and category filters.
- Product detail with stock, fulfillment method, terms, and warranty.
- Duration pricing:
  - Monthly families: months 1–11 = monthly price × months.
  - Month 12 uses annual promotional price when configured.
  - Fixed products expose only configured variants.
- Out-of-stock products cannot be ordered.

### 5.2 Locked Initial Catalog

| Product | Pricing | Stock | Fulfillment |
|---|---:|---:|---|
| YouTube Premium Member | Rp8,000/month; Rp55,000/12 months | 52 | Invite |
| Microsoft 365 Family Member | Rp10,000/month; Rp50,000/12 months | 4 | Invite |
| Google One Pro + YouTube/Music | Rp20,000/month; Rp200,000/12 months | 14 | Invite |
| Google One Pro without YouTube | Rp10,000/month; Rp130,000/12 months | 20 | Invite |
| Canva Business | Rp8,000/month; Rp55,000/12 months | 97 | Invite |
| CapCut Pro Private | Rp15,000/7 days; Rp35,000/1 month | 2 | Credentials |
| Netflix Premium UHD 1P1U | Rp35,000/1 month | 4 | Credentials |
| Disney+ Hotstar Premium Sharing | Rp25,000/1 month | 5 | Credentials |
| Alight Motion Pro Private | Rp10,000/12 months | 7 | Credentials |

### 5.3 Cart

- Browser-local cart.
- Stores product ID, variant ID, selected duration, and quantity.
- May contain multiple products and a mix of invite and credential fulfillment types.
- Synchronizes updates across tabs.
- Shows exact selected variant and server-authoritative pricing before order creation.

### 5.4 Guest Checkout

- Collects buyer name, email, and optional WhatsApp number.
- Supports BCA, SeaBank, and QRIS.
- Validates all input and current inventory server-side.
- Creates one durable order and order-item snapshot.
- Prevents duplicate submission and overselling.
- Sends order-confirmation email.

### 5.5 Payment

- BCA and SeaBank display operator-configured account details.
- QRIS converts the configured static EMVCo payload into an amount-bound payload.
- Admin confirms payment manually for MVP.
- Payment status: `pending`, `paid`, `failed`, or `refunded`.

QRIS generation must be verified against the official payload format and tested with real banking/e-wallet scanners before production. It must not depend on an untrusted third-party QR-rendering API in production.

### 5.6 Fulfillment

- Fulfillment is recorded per order item so a mixed cart can receive multiple invite links and/or credentials.
- Invite item: admin submits invite URL.
- Credential item: admin submits username and password.
- Item fulfillment status: `pending`, `sent`, `failed`, or `revoked`.
- Order fulfillment is complete only after every active order item is sent.
- Buyer can contact support for warranty claims.
- Credentials must not be exposed through a guessable public order ID.

### 5.7 Order Tracking

- Buyer receives an order-specific tracking link.
- Tracking displays status, purchased items, payment method, and total.
- Fulfillment secrets require an unguessable access token or buyer verification.
- Unknown order identifiers return not found; never fake data.

### 5.8 Admin

- Login and logout.
- Orders list, filters, detail, payment verification, cancellation, fulfillment.
- Product activation and variant stock/price management.
- Settings for BCA, SeaBank, QRIS payload, WhatsApp, email sender, and maintenance mode.
- Every mutation verifies a valid admin session inside the server action.

### 5.9 Messaging and Support

- Order-confirmation email.
- Invite and credential fulfillment emails.
- WhatsApp FAB on public pages with contextual order ID when available.
- Canonical sender target: `noreply@hyarax.works`; Resend test sender allowed before DNS verification.

## 6. Non-Goals for MVP

- Customer registration, passwords, profiles, or full order-history account.
- Automated payment gateway/webhook settlement.
- Automated vendor provisioning.
- Multiple admin roles or RBAC.
- Reviews, wishlist, referral, loyalty, coupons, or multi-currency.
- Native mobile application.
- Automated refunds.

## 7. Technical Requirements

- Next.js 16 App Router and React 19.
- TypeScript strict enough to reject invalid domain states at compile time.
- PostgreSQL on Neon with Drizzle ORM and versioned migrations.
- Transaction-capable database driver for checkout and fulfillment writes.
- Server Components for database reads; Client Components only for interaction.
- Server Actions validate input and authorize mutations.
- Resend for transactional email.
- Vercel deployment from GitHub.
- Cloudflare DNS for `apps.hyarax.works` and later Resend domain records.
- Responsive light/dark UI, keyboard navigation, visible focus, and reduced-motion support.
- No secret in `NEXT_PUBLIC_*`, repository, logs, screenshots, or documentation.

## 8. Production Release Gates

Current implementation is not production-ready until all gates pass:

- [ ] Checkout stock check, order insert, item insert, and stock decrement are one atomic transaction.
- [ ] Concurrent checkout cannot reduce stock below zero.
- [ ] Duration variants linked to one service use one shared inventory pool unless explicitly configured otherwise.
- [ ] Variant belongs to submitted product and all quantities/months are positive.
- [ ] Admin server actions verify session validity, not cookie presence only.
- [ ] Session token is cryptographically secure; admin password is hashed or compared through a safe secret strategy.
- [ ] Public tracking uses unguessable token or buyer verification.
- [ ] Fulfillment credentials are encrypted at rest and not returned publicly by order ID.
- [ ] Mixed invite/credential orders can be fulfilled independently per order item.
- [ ] QRIS CRC and amount injection pass automated vectors and real scanner tests.
- [ ] Runtime reads persisted admin settings; no hard-coded bank, QRIS, or WhatsApp values.
- [ ] Production never falls back silently to demo catalog/order data.
- [ ] All nine initial products are available from database seed/migration.
- [ ] Versioned migrations exist and match production DB.
- [ ] Typecheck, lint, tests, production build, and route smoke checks pass.

## 9. Success Metrics

These are launch acceptance metrics, not invented business forecasts:

- 100% of submitted orders use server-calculated prices and persisted items.
- 0 successful orders can oversell stock under concurrency tests.
- 100% of admin mutations reject unauthenticated requests.
- 100% of fulfillment emails reference the correct order and product access.
- 100% of supported QRIS test scans show the exact order amount.
- 0 secrets appear in public HTML, client bundles, logs, or public tracking URLs.
- Public catalog, PDP, cart, checkout, success, tracking, and admin flows pass mobile and desktop smoke tests.
- Production build and required automated checks pass before deployment.

## 10. Open Business Inputs

- Real BCA account name/number.
- Real SeaBank account name/number.
- Verified QRIS payload owned by operator.
- Real WhatsApp support number.
- Resend API key and sender-domain verification.
- Final reseller/legal terms, refund policy, and per-product warranty language.

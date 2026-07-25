# Premium Apps by Hyarax — Architecture

Status: canonical technical architecture  
Target: Vercel + Neon + Resend under `apps.hyarax.works`

## 1. System Context

```text
Buyer Browser ─┐
               ├─ HTTPS ─> Next.js on Vercel ─> Neon PostgreSQL
Admin Browser ─┘                    │
                                   ├─> Resend email
                                   ├─> QRIS payload generator
                                   └─> WhatsApp deep link

GitHub (hyaraxco/premium-apps-store) ─> Vercel deployment
Cloudflare DNS ─> apps.hyarax.works ─> Vercel
```

Architecture is a modular monolith. No API gateway, event bus, queue, microservice, or separate CMS is needed for MVP.

## 2. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Native Vercel deployment, Server Components, Server Actions, metadata routes |
| UI | React 19, Tailwind CSS 4 | Existing codebase, low-runtime tokenized styling |
| Language | TypeScript | Shared domain contracts and safer mutations |
| Database | Neon PostgreSQL | Relational ACID model, serverless hosting, production portability |
| ORM | Drizzle ORM / Drizzle Kit | SQL-like typed schema and migrations |
| Transaction driver | `@neondatabase/serverless` Pool + `drizzle-orm/neon-serverless` | Required for interactive checkout transactions; Neon HTTP remains suitable only for independent reads/writes |
| Email | Resend | Simple transactional email and domain sender support |
| Hosting | Vercel | Native Next.js support and GitHub previews |
| DNS | Cloudflare | Existing domain management |
| Cart | React Context + `localStorage` | Guest cart without account requirement |
| Cross-tab UI | BroadcastChannel + storage events | Sync cart and notifications across tabs |

## 3. Rendering Strategy

| Surface | Strategy | Freshness |
|---|---|---|
| Marketing pages | Static | Deploy-time |
| Catalog/PDP | Server Component; explicit cache/revalidation policy | Revalidate after admin product mutation |
| Cart | Client Component | Browser state |
| Checkout form | Client Component with Server Action | Dynamic |
| Success/tracking | Dynamic Server Component | No stale order state |
| Admin | Dynamic Server Components + Server Actions | No-store / strongly consistent |

Rules:

- Database access occurs directly in Server Components/server-only modules; do not add internal API routes without a client/external integration requirement.
- Client Components never import database, secrets, or server-only modules.
- `params` and `searchParams` are awaited promises under current App Router conventions.
- Mutation inputs are validated before database access.

## 4. Folder Structure

This is the canonical target structure. Routes already present in code remain part of the application even when omitted from an abbreviated subtree. Entries marked “required” do not exist yet and must be added before production.

```text
.
├── Prd.md
├── Architecture.md
├── Design.md
├── Schema.md
├── Rules.md
├── drizzle.config.ts
├── next.config.ts
├── src/
│   ├── app/
│   │   ├── admin/                 # protected operational UI and actions
│   │   ├── apps/[slug]/           # database-backed product detail
│   │   ├── checkout/              # guest checkout and order action
│   │   ├── order/[id]/            # buyer order tracking
│   │   ├── katalog/               # catalog
│   │   ├── keranjang/              # browser cart
│   │   ├── bantuan/                # support and policy
│   │   ├── cara-kerja/             # fulfillment explanation
│   │   ├── maintenance/            # maintenance state
│   │   ├── layout.tsx             # global providers and shell
│   │   ├── globals.css            # tokens, themes, motion
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── ui/                    # shared primitive components
│   │   ├── product-card.tsx
│   │   ├── pdp-variant-selector.tsx
│   │   ├── cart-view.tsx
│   │   └── checkout-form.tsx
│   ├── db/
│   │   ├── schema.ts              # declared Drizzle schema
│   │   ├── migrations/            # required; not present yet
│   │   ├── queries.ts             # server-only read model
│   │   └── seed.ts                # repeatable seed
│   ├── lib/
│   │   ├── admin-auth.ts
│   │   ├── cart-context.tsx
│   │   ├── email.ts
│   │   ├── qris.ts
│   │   └── rate-limit.ts
│   ├── middleware.ts              # current route guard; migrate to version-required convention if Next docs demand it
│   └── types/product.ts
└── package.json
```

## 5. Data Flows

### 5.1 Catalog Read

```text
Request /katalog or /apps/[slug]
  -> Server Component
  -> server-only DB query
  -> Drizzle
  -> Neon PostgreSQL
  -> Product read model with active variants, minimum price, shared available stock
  -> HTML + minimal interactive client boundary
```

Production rule: DB failure fails visibly with an error boundary. Static demo fallback is local-development-only and must never make stale inventory sellable.

### 5.2 Cart

```text
PDP variant selector
  -> CartContext.addItem(productId, variantId, months, quantity)
  -> React state
  -> localStorage
  -> BroadcastChannel/storage event
  -> cart badge, cart page, checkout summary
```

Cart data is advisory. Server reloads product/variant and recalculates price and stock during checkout.

### 5.3 Atomic Checkout

```text
CheckoutForm
  -> validated Server Action
  -> rate limit + idempotency check
  -> DB transaction (serializable or guarded atomic update)
       1. load submitted variants and verify product ownership
       2. validate positive months/quantity
       3. calculate prices server-side
       4. decrement shared inventory pool with available stock >= requested predicate
       5. insert order
       6. insert order item snapshots
  -> commit
  -> send confirmation email
  -> redirect to payment instructions
```

Email failure does not roll back a committed order; it records delivery failure and allows retry.

### 5.4 Manual Payment and Fulfillment

```text
Admin opens order
  -> valid server-side admin session
  -> marks payment paid
  -> enters invite link OR credentials
  -> DB transaction inserts/updates fulfillment per order item
  -> derive aggregate order fulfillment state from all active items
  -> Resend fulfillment email
  -> delivery result recorded
```

### 5.5 QRIS

```text
Static QRIS payload from protected setting
  -> parse EMVCo TLV
  -> remove/replace transaction amount tag 54
  -> recalculate CRC tag 63 using verified QRIS algorithm
  -> render QR locally/server-side
  -> buyer scans exact amount
```

QR payload must not leave the service through a public QR-rendering URL in production.

## 6. Security Boundaries

- Public browser: untrusted.
- Server Actions: trust boundary; validate and authorize every call.
- Admin cookie: identifier only; session validity checked server-side.
- Neon and Resend keys: server-only environment variables.
- Public order tracking: unguessable access token; order ID alone is insufficient.
- Fulfillment credentials: encrypted at rest, redacted in logs, never serialized into unrelated pages.
- Admin actions: session verification inside each action; route middleware alone is insufficient.
- Payment settings: read from DB only on server.

## 7. Technical Decisions

### PostgreSQL over file/SQLite

Vercel functions do not provide durable local filesystem storage. PostgreSQL supports relational integrity, concurrent stock updates, transactions, and migration tooling.

### Drizzle over larger ORM abstraction

Project benefits from explicit SQL-shaped queries, small runtime, typed schema, and migration control. Drizzle does not replace database constraints; constraints remain required.

### Modular monolith over microservices

Catalog, orders, fulfillment, admin, and email volume are MVP-scale and share transactions. Splitting services would add failure modes without business value.

### Guest checkout over customer auth

Buyer account provides little MVP value. Secure tracking token and email receipt cover order access while reducing auth surface. Admin auth remains mandatory.

### Manual payment verification first

Matches current operations and avoids premature gateway integration. Data model keeps payment method/status separable for future webhook automation.

### Local cart, server-authoritative checkout

Guest cart stays fast and dependency-free; persisted price/stock are never trusted from browser.

### Resend for transactional mail

Simple API and custom-domain support. Email is an external side effect and must be retryable/idempotent.

### CSS custom-property design tokens

One application needs consistent theming, not a separate component package or Storybook platform.

### Experimental View Transitions

React/Next experimental View Transitions are progressive enhancement. Navigation, checkout, and admin behavior must remain correct when the browser or future framework version disables them. Every Next.js/React upgrade requires route-transition regression checks; remove the experiment rather than block core commerce when compatibility breaks.

## 8. Current Technical Debt Requiring Resolution

- Current checkout uses Neon HTTP and non-transactional sequential writes.
- Stock read then decrement is race-prone.
- Current public order route can display plaintext credentials by order ID.
- Current admin route guard checks cookie presence while actions lack internal auth checks.
- Current rate limiter is process-local and ineffective across Vercel instances.
- Current QRIS algorithm and payload insertion are not independently verified.
- Current success page and WhatsApp/payment details contain hard-coded fallback values.
- Static catalog fallback has only three products while seed defines nine.
- Client cart/checkout resolve products through the three-product static module, so DB-only products can disappear from summaries.
- Current variant rows duplicate the same service stock and are summed, which double-counts shared inventory.
- Current single fulfillment row cannot represent mixed invite/credential carts.
- No checked-in migrations currently prove schema parity.

These are release blockers, not accepted architecture.

# Premium Apps by Hyarax — Database Schema

Status: current declared Drizzle schema plus required production constraints  
Database: PostgreSQL on Neon  
Source: `src/db/schema.ts`

Important: no checked-in migrations or live database introspection currently prove production parity. Declared code is not proof of deployed schema.

## 1. Relationship Model

```text
products 1 ───────< product_variants
inventory_pools 1 ───────< product_variants (target shared-stock model)

orders   1 ───────< order_items
order_items 1 ─────  order_fulfillments (target cardinality: 0..1 per item)

admin_sessions    independent
admin_settings    independent key/value configuration
```

`order_items` intentionally snapshots names, labels, duration, quantity, and prices. Decide whether logical product/variant IDs remain non-FK snapshots or gain restrictive FKs; do not cascade-delete historical order evidence.

Initial catalog duration variants share the service stock shown by the operator. Target schema therefore uses an inventory pool shared by variants of one service. Current duplicated per-variant `stock` is a known incompatible implementation and must be migrated before production.

## 2. Current Declared Tables

### 2.1 `products`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(64)` | No | — | PK |
| `slug` | `varchar(128)` | No | — | UNIQUE |
| `name` | `varchar(256)` | No | — | — |
| `category` | `varchar(64)` | No | — | no check yet |
| `fulfillment_type` | `varchar(32)` | No | — | no check yet |
| `description` | `text` | No | — | — |
| `long_description` | `text` | No | — | — |
| `sk` | `text` | Yes | — | — |
| `garansi` | `text` | Yes | — | — |
| `badge` | `varchar(64)` | Yes | — | — |
| `accent` | `varchar(32)` | No | `#10A37F` | — |
| `icon` | `varchar(16)` | No | `P` | — |
| `is_active` | `boolean` | No | `true` | — |
| `sort_order` | `integer` | No | `0` | — |
| `created_at` | `timestamp` | No | `now()` | timezone not declared |

Required checks:

- `category` in supported category set.
- `fulfillment_type IN ('invite', 'credential')`.
- Accent format if UI accepts user input.

### 2.2 `product_variants`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(64)` | No | — | PK |
| `product_id` | `varchar(64)` | No | — | FK → `products.id`, cascade delete |
| `label` | `varchar(128)` | No | — | — |
| `duration_days` | `integer` | Yes | — | no check yet |
| `duration_months` | `integer` | Yes | — | no check yet |
| `price_monthly_idr` | `integer` | Yes | — | no check yet |
| `price_idr` | `integer` | No | — | no check yet |
| `is_promo` | `boolean` | No | `false` | — |
| `stock` | `integer` | No | `0` | no check yet |
| `is_active` | `boolean` | No | `true` | — |
| `sort_order` | `integer` | No | `0` | — |

Required checks:

- `stock >= 0`.
- Prices `>= 0`.
- Exactly one supported duration representation is present.
- Duration values are positive.
- Unique variant identity appropriate to product, e.g. `UNIQUE(product_id, label)` or stable SKU.
- Target: add `inventory_pool_id` FK and stop treating each duration as independent stock unless business data explicitly says it is independent.

### 2.2a Target `inventory_pools` (required; not declared yet)

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(64)` | No | — | PK |
| `product_id` | `varchar(64)` | No | — | FK → `products.id`, restrict delete |
| `available_stock` | `integer` | No | `0` | CHECK `>= 0` |
| `updated_at` | `timestamptz` | No | `now()` | — |

One pool per product is sufficient for the initial catalog. Schema permits multiple pools later only when supplier/inventory semantics require it.

### 2.3 `orders`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(32)` | No | — | PK |
| `buyer_name` | `varchar(128)` | No | — | — |
| `buyer_email` | `varchar(256)` | No | — | — |
| `buyer_whatsapp` | `varchar(64)` | Yes | — | — |
| `payment_method` | `varchar(32)` | No | — | no check yet |
| `total_idr` | `integer` | No | — | no check yet |
| `status` | `varchar(32)` | No | `pending` | no check yet |
| `payment_note` | `text` | Yes | — | — |
| `created_at` | `timestamp` | No | `now()` | timezone not declared |
| `updated_at` | `timestamp` | No | `now()` | app-managed only |

Required changes:

- `payment_method IN ('bca', 'seabank', 'qris')`.
- Replace overloaded `status` with `payment_status IN ('pending', 'paid', 'failed', 'refunded')` and `fulfillment_status IN ('pending', 'partial', 'fulfilled', 'failed', 'cancelled')`, or add both columns during expand/contract migration before removing legacy status.
- `total_idr >= 0`.
- Add unguessable public tracking token with UNIQUE constraint.
- Add idempotency key with UNIQUE constraint for checkout retries.
- Prefer `timestamptz` for all timestamps.

### 2.4 `order_items`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(64)` | No | — | PK |
| `order_id` | `varchar(32)` | No | — | FK → `orders.id`, cascade delete |
| `product_id` | `varchar(64)` | No | — | snapshot logical ID; no FK |
| `variant_id` | `varchar(64)` | No | — | snapshot logical ID; no FK |
| `product_name` | `varchar(256)` | No | — | snapshot |
| `variant_label` | `varchar(128)` | No | — | snapshot |
| `months` | `integer` | No | `1` | no check yet |
| `qty` | `integer` | No | `1` | no check yet |
| `unit_price_idr` | `integer` | No | — | no check yet |
| `subtotal_idr` | `integer` | No | — | no check yet |

Required checks:

- `months > 0`.
- `qty > 0`.
- Monetary values `>= 0`.
- Server enforces `subtotal_idr = unit_price_idr × qty` at write time.

### 2.5 `order_fulfillments`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `id` | `varchar(64)` | No | — | PK |
| `order_id` | `varchar(32)` | No | — | FK → `orders.id`, cascade delete |
| `order_item_id` | target `varchar(64)` | No | — | required FK → `order_items.id`, cascade delete |
| `type` | `varchar(32)` | No | — | no check yet |
| `invite_link` | `text` | Yes | — | — |
| `username` | `varchar(256)` | Yes | — | — |
| `password` | `text` | Yes | — | plaintext today |
| `notes` | `text` | Yes | — | — |
| `sent_at` | `timestamp` | No | `now()` | — |

Required changes:

- Add `order_item_id` and `UNIQUE(order_item_id)`; one order may have many fulfillment rows through its items.
- `type IN ('invite', 'credential')`.
- Invite type requires invite link; credential type requires username and encrypted secret.
- Replace plaintext `password` with encrypted ciphertext, key version, and optional expiry/redaction timestamp.
- Track email delivery status and last attempt.

### 2.6 `admin_sessions`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `token` | `varchar(128)` | No | — | PK |
| `created_at` | `timestamp` | No | `now()` | — |
| `expires_at` | `timestamp` | No | — | — |

Required changes:

- Store hash of cryptographically random token, not raw predictable token.
- Add expiry cleanup process/index.
- Consider `revoked_at`, `last_used_at`, and operator ID when multi-admin is added.

### 2.7 `admin_settings`

| Column | PostgreSQL type | Null | Default | Constraint |
|---|---|---:|---|---|
| `key` | `varchar(128)` | No | — | PK |
| `value` | `text` | No | — | — |
| `updated_at` | `timestamp` | No | `now()` | app-managed |

Known keys:

- `bca_name`
- `bca_number`
- `seabank_name`
- `seabank_number`
- `qris_string`
- `admin_wa`
- `maintenance_mode`

Settings are server-only. Avoid returning whole setting maps to clients.

## 3. Required Indexes

Current schema declares only PK indexes and `products.slug` uniqueness. Add migrations for:

```text
inventory_pools(product_id)
product_variants(product_id)
product_variants(inventory_pool_id)
product_variants(product_id, is_active, sort_order)
order_items(order_id)
order_fulfillments(order_id)
order_fulfillments(order_item_id) UNIQUE
orders(created_at DESC)
orders(payment_status, created_at DESC)  -- target after status split
orders(fulfillment_status, created_at DESC)  -- target after status split
orders(buyer_email, created_at DESC)
orders(public_token) UNIQUE
orders(idempotency_key) UNIQUE
admin_sessions(expires_at)
```

## 4. Transaction Rules

### Checkout

Required one transaction:

1. Validate variant belongs to product.
2. Validate quantity/months.
3. Calculate price server-side.
4. Atomically decrement shared inventory pool with `available_stock >= requested` predicate.
5. Insert order and item snapshots.
6. Commit.

If any step fails, all writes roll back. Neon HTTP independent writes do not satisfy this requirement; use transaction-capable Neon serverless Pool/driver as documented by Drizzle.

### Fulfillment

Required one transaction:

1. Verify admin session.
2. Insert/update fulfillment for one order item.
3. Recompute aggregate fulfillment status; mark order fulfilled only when every active item is sent.
4. Commit.
5. Send email outside transaction and record delivery result/retry state.

## 5. Migration Policy

- Production uses checked-in migrations; never use `drizzle-kit push` as sole schema history.
- Generate migration, inspect SQL, test on disposable database, then apply.
- Never edit an applied migration.
- Use expand → migrate/backfill → contract for breaking changes.
- Add nullable/new-default columns before code depends on them.
- Create large indexes concurrently where supported.
- Seed scripts are idempotent and update intended catalog records explicitly; `onConflictDoNothing()` is insufficient for catalog synchronization.
- Backup/branch Neon database before destructive migrations.
- Document every persisted-data migration in PR/commit notes.

## 6. Query Rules

- No `SELECT *` in business paths when narrower selection is practical.
- Avoid per-product loops that filter all variants in memory; use relational query/join grouped by product.
- Public slug query requires `products.is_active = true` and active variants.
- Admin reads may include inactive rows explicitly.
- Unknown DB errors surface typed failures; production never returns demo records.
- Every mutation verifies affected row count.
- Every payment-status and fulfillment-status transition follows its allowed state machine.

## 7. Data Retention and Secrets

- Order item snapshots remain after catalog changes.
- Do not cascade product deletion into historical orders.
- Payment and buyer PII access is admin-only.
- Credentials are encrypted and redacted after warranty/retention window defined by business policy.
- Logs never contain credential values, session token, QRIS source payload, or full buyer PII.

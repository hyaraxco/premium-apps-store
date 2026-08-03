import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// 1. PRODUCTS
export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  fulfillmentType: varchar("fulfillment_type", { length: 32 }).notNull(), // invite | credential
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  sk: text("sk"),
  garansi: text("garansi"),
  badge: varchar("badge", { length: 64 }),
  accent: varchar("accent", { length: 32 }).notNull().default("#10A37F"),
  icon: varchar("icon", { length: 16 }).notNull().default("P"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 1b. SHARED INVENTORY POOL (one per product for MVP)
export const inventoryPools = pgTable(
  "inventory_pools",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    productId: varchar("product_id", { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    availableStock: integer("available_stock").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("inventory_pools_product_id_uidx").on(t.productId)],
);

// 2. PRODUCT VARIANTS
export const productVariants = pgTable(
  "product_variants",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    productId: varchar("product_id", { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    inventoryPoolId: varchar("inventory_pool_id", { length: 64 }).references(
      () => inventoryPools.id,
      { onDelete: "set null" },
    ),
    label: varchar("label", { length: 128 }).notNull(),
    durationDays: integer("duration_days"),
    durationMonths: integer("duration_months"),
    priceMonthlyIDR: integer("price_monthly_idr"),
    priceIDR: integer("price_idr").notNull(),
    isPromo: boolean("is_promo").notNull().default(false),
    /** @deprecated use inventory_pools.available_stock — kept during expand phase */
    stock: integer("stock").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("product_variants_product_id_idx").on(t.productId),
    index("product_variants_pool_id_idx").on(t.inventoryPoolId),
  ],
);

// 3. ORDERS
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    buyerName: varchar("buyer_name", { length: 128 }).notNull(),
    buyerEmail: varchar("buyer_email", { length: 256 }).notNull(),
    buyerWhatsapp: varchar("buyer_whatsapp", { length: 64 }),
    paymentMethod: varchar("payment_method", { length: 32 }).notNull(), // bca | seabank | qris
    totalIDR: integer("total_idr").notNull(),
    /** @deprecated dual-write; prefer paymentStatus + fulfillmentStatus */
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    paymentStatus: varchar("payment_status", { length: 32 })
      .notNull()
      .default("pending"), // pending | paid | failed | refunded | cancelled
    fulfillmentStatus: varchar("fulfillment_status", { length: 32 })
      .notNull()
      .default("pending"), // pending | partial | fulfilled | failed | revoked
    paymentExpiresAt: timestamp("payment_expires_at", { withTimezone: true }),
    publicTokenHash: varchar("public_token_hash", { length: 128 }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    verifiedBy: varchar("verified_by", { length: 64 }),
    paymentReference: text("payment_reference"),
    paymentNote: text("payment_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_public_token_hash_uidx").on(t.publicTokenHash),
    uniqueIndex("orders_idempotency_key_uidx").on(t.idempotencyKey),
    index("orders_payment_expires_idx").on(t.paymentStatus, t.paymentExpiresAt),
    index("orders_buyer_email_idx").on(t.buyerEmail),
  ],
);

// 4. ORDER ITEMS
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orderId: varchar("order_id", { length: 32 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 64 }).notNull(),
    variantId: varchar("variant_id", { length: 64 }).notNull(),
    productName: varchar("product_name", { length: 256 }).notNull(),
    variantLabel: varchar("variant_label", { length: 128 }).notNull(),
    fulfillmentType: varchar("fulfillment_type", { length: 32 }).notNull().default("invite"),
    durationUnit: varchar("duration_unit", { length: 16 }).notNull().default("month"), // day | month
    durationValue: integer("duration_value").notNull().default(1),
    months: integer("months").notNull().default(1), // legacy dual field
    qty: integer("qty").notNull().default(1),
    unitPriceIDR: integer("unit_price_idr").notNull(),
    subtotalIDR: integer("subtotal_idr").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

// 5. LEGACY order-level fulfillments (expand: keep until units cutover)
export const orderFulfillments = pgTable("order_fulfillments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 32 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(),
  inviteLink: text("invite_link"),
  username: varchar("username", { length: 256 }),
  password: text("password"),
  notes: text("notes"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5b. PER-UNIT FULFILLMENT (qty N → N rows)
export const orderFulfillmentUnits = pgTable(
  "order_fulfillment_units",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orderId: varchar("order_id", { length: 32 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: varchar("order_item_id", { length: 64 })
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    unitIndex: integer("unit_index").notNull(),
    type: varchar("type", { length: 32 }).notNull(), // invite | credential
    inviteLink: text("invite_link"),
    username: varchar("username", { length: 256 }),
    secretCiphertext: text("secret_ciphertext"),
    secretKeyVersion: integer("secret_key_version"),
    notes: text("notes"),
    unitStatus: varchar("unit_status", { length: 32 }).notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveryStatus: varchar("delivery_status", { length: 32 }).notNull().default("pending"),
    deliveryAttemptCount: integer("delivery_attempt_count").notNull().default(0),
    lastDeliveryAttemptAt: timestamp("last_delivery_attempt_at", { withTimezone: true }),
    lastDeliveryError: text("last_delivery_error"),
  },
  (t) => [
    uniqueIndex("order_fulfillment_units_item_unit_uidx").on(t.orderItemId, t.unitIndex),
    index("order_fulfillment_units_order_id_idx").on(t.orderId),
  ],
);

// 6. ADMIN SESSIONS
export const adminSessions = pgTable(
  "admin_sessions",
  {
    token: varchar("token", { length: 128 }).primaryKey(),
    tokenHash: varchar("token_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("admin_sessions_expires_idx").on(t.expiresAt)],
);

// 7. ADMIN SETTINGS
// NOTE: `value` stays TEXT (not json/jsonb) on purpose: it holds BOTH plain
// string settings (bca_name, qris_string, ...) AND JSON-stringified blobs
// (ratelimit_* counters from src/lib/rate-limit.ts). A jsonb column would
// break selects over the plain-string rows (drizzle auto-parses jsonb).
// JSON blobs must be stringified/parsed via the helpers in rate-limit.ts.
export const adminSettings = pgTable("admin_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

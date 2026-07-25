import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// 1. PRODUCTS
export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // productivity, design, developer, ai, media, security
  fulfillmentType: varchar("fulfillment_type", { length: 32 }).notNull(), // invite | credential
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  sk: text("sk"), // Syarat & Ketentuan
  garansi: text("garansi"),
  badge: varchar("badge", { length: 64 }),
  accent: varchar("accent", { length: 32 }).notNull().default("#10A37F"),
  icon: varchar("icon", { length: 16 }).notNull().default("P"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. PRODUCT VARIANTS (Prices & Stock)
export const productVariants = pgTable("product_variants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("product_id", { length: 64 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 128 }).notNull(), // e.g. "1 Bulan", "12 Bulan Promo", "7 Hari"
  durationDays: integer("duration_days"), // for 7D
  durationMonths: integer("duration_months"), // for 1M, 12M
  priceMonthlyIDR: integer("price_monthly_idr"), // base monthly rate if calculable
  priceIDR: integer("price_idr").notNull(), // final variant price
  isPromo: boolean("is_promo").notNull().default(false),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 3. ORDERS
export const orders = pgTable("orders", {
  id: varchar("id", { length: 32 }).primaryKey(), // SB-YYYYMMDD-XXXX
  buyerName: varchar("buyer_name", { length: 128 }).notNull(),
  buyerEmail: varchar("buyer_email", { length: 256 }).notNull(),
  buyerWhatsapp: varchar("buyer_whatsapp", { length: 64 }),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(), // bca | seabank | qris
  totalIDR: integer("total_idr").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending | paid | fulfilled | failed | cancelled
  paymentNote: text("payment_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. ORDER ITEMS
export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 32 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  productName: varchar("product_name", { length: 256 }).notNull(),
  variantLabel: varchar("variant_label", { length: 128 }).notNull(),
  months: integer("months").notNull().default(1),
  qty: integer("qty").notNull().default(1),
  unitPriceIDR: integer("unit_price_idr").notNull(),
  subtotalIDR: integer("subtotal_idr").notNull(),
});

// 5. ORDER FULFILLMENTS
export const orderFulfillments = pgTable("order_fulfillments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 32 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(), // invite | credential
  inviteLink: text("invite_link"),
  username: varchar("username", { length: 256 }),
  password: text("password"),
  notes: text("notes"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// 6. ADMIN SESSIONS
export const adminSessions = pgTable("admin_sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// 7. ADMIN SETTINGS
export const adminSettings = pgTable("admin_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

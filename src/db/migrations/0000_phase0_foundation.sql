CREATE TABLE "admin_sessions" (
	"token" varchar(128) PRIMARY KEY NOT NULL,
	"token_hash" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_pools" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"available_stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fulfillment_units" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"order_item_id" varchar(64) NOT NULL,
	"unit_index" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"invite_link" text,
	"username" varchar(256),
	"secret_ciphertext" text,
	"secret_key_version" integer,
	"notes" text,
	"unit_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"delivery_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"delivery_attempt_count" integer DEFAULT 0 NOT NULL,
	"last_delivery_attempt_at" timestamp with time zone,
	"last_delivery_error" text
);
--> statement-breakpoint
CREATE TABLE "order_fulfillments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"type" varchar(32) NOT NULL,
	"invite_link" text,
	"username" varchar(256),
	"password" text,
	"notes" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64) NOT NULL,
	"product_name" varchar(256) NOT NULL,
	"variant_label" varchar(128) NOT NULL,
	"fulfillment_type" varchar(32) DEFAULT 'invite' NOT NULL,
	"duration_unit" varchar(16) DEFAULT 'month' NOT NULL,
	"duration_value" integer DEFAULT 1 NOT NULL,
	"months" integer DEFAULT 1 NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_idr" integer NOT NULL,
	"subtotal_idr" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"buyer_name" varchar(128) NOT NULL,
	"buyer_email" varchar(256) NOT NULL,
	"buyer_whatsapp" varchar(64),
	"payment_method" varchar(32) NOT NULL,
	"total_idr" integer NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"fulfillment_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_expires_at" timestamp with time zone,
	"public_token_hash" varchar(128),
	"idempotency_key" varchar(128),
	"paid_at" timestamp with time zone,
	"verified_by" varchar(64),
	"payment_reference" text,
	"payment_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"inventory_pool_id" varchar(64),
	"label" varchar(128) NOT NULL,
	"duration_days" integer,
	"duration_months" integer,
	"price_monthly_idr" integer,
	"price_idr" integer NOT NULL,
	"is_promo" boolean DEFAULT false NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"category" varchar(64) NOT NULL,
	"fulfillment_type" varchar(32) NOT NULL,
	"description" text NOT NULL,
	"long_description" text NOT NULL,
	"sk" text,
	"garansi" text,
	"badge" varchar(64),
	"accent" varchar(32) DEFAULT '#10A37F' NOT NULL,
	"icon" varchar(16) DEFAULT 'P' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "inventory_pools" ADD CONSTRAINT "inventory_pools_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fulfillment_units" ADD CONSTRAINT "order_fulfillment_units_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fulfillment_units" ADD CONSTRAINT "order_fulfillment_units_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_inventory_pool_id_inventory_pools_id_fk" FOREIGN KEY ("inventory_pool_id") REFERENCES "public"."inventory_pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_pools_product_id_uidx" ON "inventory_pools" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_fulfillment_units_item_unit_uidx" ON "order_fulfillment_units" USING btree ("order_item_id","unit_index");--> statement-breakpoint
CREATE INDEX "order_fulfillment_units_order_id_idx" ON "order_fulfillment_units" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_public_token_hash_uidx" ON "orders" USING btree ("public_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uidx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_payment_expires_idx" ON "orders" USING btree ("payment_status","payment_expires_at");--> statement-breakpoint
CREATE INDEX "orders_buyer_email_idx" ON "orders" USING btree ("buyer_email");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_pool_id_idx" ON "product_variants" USING btree ("inventory_pool_id");
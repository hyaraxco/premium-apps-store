export type BillingPeriod = "lifetime" | "monthly" | "yearly";
export type ProductCategory =
  | "productivity"
  | "design"
  | "developer"
  | "ai"
  | "media"
  | "security";

export type ProductStatus = "available" | "limited" | "preorder" | "out_of_stock";
export type FulfillmentType = "invite" | "credential";

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  durationDays?: number | null;
  durationMonths?: number | null;
  priceMonthlyIDR?: number | null;
  priceIDR: number;
  isPromo: boolean;
  stock: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  longDescription: string;
  category: ProductCategory;
  fulfillmentType: FulfillmentType;
  sk?: string | null;
  garansi?: string | null;
  badge?: string | null;
  accent: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  
  // Computed / aggregated attributes for UI
  variants: ProductVariant[];
  minPriceIDR: number;
  totalStock: number;
  status: ProductStatus;
  delivery: string;
  licenseNote: string;
  
  // Legacy / Compat
  billing?: BillingPeriod;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  platforms?: string[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  months?: number;
  quantity: number;
}

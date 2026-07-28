import type { Product, ProductCategory } from "@/types/product";

export const categories: {
  id: ProductCategory | "all";
  label: string;
  description: string;
}[] = [
  { id: "all", label: "Semua", description: "Katalog lengkap" },
  { id: "productivity", label: "Produktivitas", description: "Fokus & alur kerja" },
  { id: "design", label: "Desain", description: "UI, visual, branding" },
  { id: "developer", label: "Developer", description: "IDE, API, DevOps" },
  { id: "ai", label: "AI Tools", description: "Model & copilot" },
  { id: "media", label: "Media", description: "Audio, video, streaming" },
  { id: "security", label: "Keamanan", description: "Password & privasi" },
];

function p(
  partial: Omit<Product, "tagline" | "price"> & { tagline?: string },
): Product {
  return {
    ...partial,
    tagline: partial.tagline ?? partial.description,
    price: partial.minPriceIDR,
  };
}

/** Offline / no-DATABASE_URL fallback — full 9-product catalog, pool stock (not summed). */
export const products: Product[] = [
  p({
    id: "yt-premium",
    slug: "youtube-premium-member",
    name: "YouTube Premium Member",
    description: "Paket Family Member via invite link ke akun Google Anda.",
    longDescription: "Perpanjangan di akun yang sama. Family share benefits only.",
    category: "media",
    fulfillmentType: "invite",
    sk: "Perpanjangan akun sama.",
    garansi: "FULL GARANSI jika premium hilang / family disable.",
    accent: "#FF0000",
    icon: "Y",
    isActive: true,
    sortOrder: 1,
    variants: [
      { id: "yt-1m", productId: "yt-premium", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 8000, priceIDR: 8000, isPromo: false, stock: 52, isActive: true, sortOrder: 1 },
      { id: "yt-12m", productId: "yt-premium", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 8000, priceIDR: 55000, isPromo: true, stock: 52, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 8000,
    totalStock: 52,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Invite",
  }),
  p({
    id: "ms-365",
    slug: "microsoft-365-member",
    name: "Microsoft 365 Family Member",
    description: "1 TB OneDrive, Copilot 365, Office apps.",
    longDescription: "Family Member via invite.",
    category: "productivity",
    fulfillmentType: "invite",
    badge: "Popular",
    accent: "#0078D4",
    icon: "M",
    isActive: true,
    sortOrder: 2,
    variants: [
      { id: "ms-1m", productId: "ms-365", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 10000, priceIDR: 10000, isPromo: false, stock: 4, isActive: true, sortOrder: 1 },
      { id: "ms-12m", productId: "ms-365", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 10000, priceIDR: 50000, isPromo: true, stock: 4, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 10000,
    totalStock: 4,
    status: "limited",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Invite",
  }),
  p({
    id: "g1-pro-yt",
    slug: "google-one-pro-yt",
    name: "Google One Pro (+YT & Music)",
    description: "5TB + Gemini + YouTube & Music Premium.",
    longDescription: "Family invite, 5TB, AI credits.",
    category: "ai",
    fulfillmentType: "invite",
    badge: "Best seller",
    accent: "#4285F4",
    icon: "G",
    isActive: true,
    sortOrder: 3,
    variants: [
      { id: "g1-yt-1m", productId: "g1-pro-yt", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 20000, priceIDR: 20000, isPromo: false, stock: 14, isActive: true, sortOrder: 1 },
      { id: "g1-yt-12m", productId: "g1-pro-yt", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 20000, priceIDR: 200000, isPromo: true, stock: 14, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 20000,
    totalStock: 14,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Invite",
  }),
  p({
    id: "g1-pro-no-yt",
    slug: "google-one-pro-no-yt",
    name: "Google One Pro (tanpa YT)",
    description: "5TB + Gemini tanpa YouTube Premium.",
    longDescription: "Mode hemat tanpa YT.",
    category: "ai",
    fulfillmentType: "invite",
    accent: "#34A853",
    icon: "G",
    isActive: true,
    sortOrder: 4,
    variants: [
      { id: "g1-noyt-1m", productId: "g1-pro-no-yt", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 10000, priceIDR: 10000, isPromo: false, stock: 20, isActive: true, sortOrder: 1 },
      { id: "g1-noyt-12m", productId: "g1-pro-no-yt", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 10000, priceIDR: 130000, isPromo: true, stock: 20, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 10000,
    totalStock: 20,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Invite",
  }),
  p({
    id: "canva-biz",
    slug: "canva-business",
    name: "Canva Business",
    description: "Canva Pro + Designer via invite.",
    longDescription: "Invite link tim bisnis.",
    category: "design",
    fulfillmentType: "invite",
    badge: "Hot",
    accent: "#00C4CC",
    icon: "C",
    isActive: true,
    sortOrder: 5,
    variants: [
      { id: "canva-1m", productId: "canva-biz", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 8000, priceIDR: 8000, isPromo: false, stock: 97, isActive: true, sortOrder: 1 },
      { id: "canva-12m", productId: "canva-biz", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 8000, priceIDR: 55000, isPromo: true, stock: 97, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 8000,
    totalStock: 97,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Invite",
  }),
  p({
    id: "capcut-pro",
    slug: "capcut-pro-private",
    name: "CapCut Pro Private",
    description: "Akun private CapCut Pro.",
    longDescription: "Credential private, limit device.",
    category: "media",
    fulfillmentType: "credential",
    accent: "#111111",
    icon: "C",
    isActive: true,
    sortOrder: 6,
    variants: [
      { id: "capcut-7d", productId: "capcut-pro", label: "7 Hari", durationDays: 7, priceIDR: 15000, isPromo: false, stock: 2, isActive: true, sortOrder: 1 },
      { id: "capcut-1m", productId: "capcut-pro", label: "1 Bulan", durationMonths: 1, priceIDR: 35000, isPromo: false, stock: 2, isActive: true, sortOrder: 2 },
    ],
    minPriceIDR: 15000,
    totalStock: 2,
    status: "limited",
    delivery: "Akun private · 10–30 menit",
    licenseNote: "Credential",
  }),
  p({
    id: "netflix-uhd",
    slug: "netflix-premium-uhd",
    name: "Netflix Premium UHD (1P1U)",
    description: "1 Profil 1 User 4K 1 Bulan.",
    longDescription: "Credential 1P1U.",
    category: "media",
    fulfillmentType: "credential",
    accent: "#E50914",
    icon: "N",
    isActive: true,
    sortOrder: 7,
    variants: [
      { id: "netflix-1m", productId: "netflix-uhd", label: "1 Bulan", durationMonths: 1, priceIDR: 35000, isPromo: false, stock: 4, isActive: true, sortOrder: 1 },
    ],
    minPriceIDR: 35000,
    totalStock: 4,
    status: "limited",
    delivery: "Akun private · 10–30 menit",
    licenseNote: "Credential",
  }),
  p({
    id: "disney-hotstar",
    slug: "disney-hotstar-premium",
    name: "Disney+ Hotstar Premium Sharing",
    description: "Sharing 1 device 4K 1 Bulan.",
    longDescription: "Credential sharing.",
    category: "media",
    fulfillmentType: "credential",
    accent: "#113CCF",
    icon: "D",
    isActive: true,
    sortOrder: 8,
    variants: [
      { id: "disney-1m", productId: "disney-hotstar", label: "1 Bulan", durationMonths: 1, priceIDR: 25000, isPromo: false, stock: 5, isActive: true, sortOrder: 1 },
    ],
    minPriceIDR: 25000,
    totalStock: 5,
    status: "limited",
    delivery: "Akun private · 10–30 menit",
    licenseNote: "Credential",
  }),
  p({
    id: "alight-motion",
    slug: "alight-motion-pro",
    name: "Alight Motion Pro Private",
    description: "Private 12 Bulan.",
    longDescription: "Credential 12 bulan.",
    category: "design",
    fulfillmentType: "credential",
    accent: "#6C5CE7",
    icon: "A",
    isActive: true,
    sortOrder: 9,
    variants: [
      { id: "alight-12m", productId: "alight-motion", label: "12 Bulan", durationMonths: 12, priceIDR: 10000, isPromo: false, stock: 7, isActive: true, sortOrder: 1 },
    ],
    minPriceIDR: 10000,
    totalStock: 7,
    status: "available",
    delivery: "Akun private · 10–30 menit",
    licenseNote: "Credential",
  }),
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((x) => x.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((x) => x.id === id);
}

export function getFeaturedProducts(): Product[] {
  return products.slice(0, 6);
}

export function getRelatedProducts(product: Product): Product[] {
  return products.filter(
    (x) => x.category === product.category && x.id !== product.id,
  );
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (x) =>
      x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q),
  );
}

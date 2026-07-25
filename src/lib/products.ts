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

// Fallback products mock matching real 9 products for client build / fallback
export const products: Product[] = [
  {
    id: "yt-premium",
    slug: "youtube-premium-member",
    name: "YouTube Premium Member",
    tagline: "Bisa perpanjangan tiap bulan di akun yang sama",
    description: "Paket Family Member via invite link ke akun Google Anda.",
    longDescription: "Bisa perpanjangan tiap bulan di akun yang sama. Privacy aman, Family hanya berbagi benefits tidak berbagi riwayat atau preferensi tayangan.",
    category: "media",
    fulfillmentType: "invite",
    sk: "Perpanjangan akun sama. Bebas iklan di YouTube & YouTube Music.",
    garansi: "FULL GARANSI jika premium hilang atau keluarga kena disable.",
    accent: "#FF0000",
    icon: "Y",
    isActive: true,
    sortOrder: 1,
    variants: [
      { id: "yt-1m", productId: "yt-premium", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 8000, priceIDR: 8000, isPromo: false, stock: 52, isActive: true, sortOrder: 1 },
      { id: "yt-12m", productId: "yt-premium", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 8000, priceIDR: 55000, isPromo: true, stock: 52, isActive: true, sortOrder: 2 }
    ],
    minPriceIDR: 8000,
    totalStock: 52,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Akun baru atau perpanjang di akun sama",
    price: 8000
  },
  {
    id: "ms-365",
    slug: "microsoft-365-member",
    name: "Microsoft 365 Family Member",
    tagline: "1 TB Storage OneDrive, Copilot 365, Word, Excel, PowerPoint",
    description: "1 TB Storage OneDrive, Copilot 365, Word, Excel, PowerPoint.",
    longDescription: "Paket Family Member via invite ke akun Microsoft Anda. Unlock semua software/aplikasi 365 di Android/iOS/Mac/Windows.",
    category: "productivity",
    fulfillmentType: "invite",
    sk: "Unlock Word, Excel, PowerPoint, OneNote, Designer, Clipchamp, Copilot di Outlook/Word.",
    garansi: "FULL GARANSI jika lisensi/stok mati sebelum waktunya.",
    badge: "Popular",
    accent: "#0078D4",
    icon: "M",
    isActive: true,
    sortOrder: 2,
    variants: [
      { id: "ms-1m", productId: "ms-365", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 10000, priceIDR: 10000, isPromo: false, stock: 4, isActive: true, sortOrder: 1 },
      { id: "ms-12m", productId: "ms-365", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 10000, priceIDR: 50000, isPromo: true, stock: 4, isActive: true, sortOrder: 2 }
    ],
    minPriceIDR: 10000,
    totalStock: 4,
    status: "limited",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Akun baru atau perpanjang di akun sama",
    price: 10000
  },
  {
    id: "g1-pro-yt",
    slug: "google-one-pro-yt",
    name: "Google One Pro (+YT & Music)",
    tagline: "5TB Storage, Gemini 3 Pro, Veo 3.1, plus YouTube & Music Premium",
    description: "5TB Storage, Gemini 3 Pro, Veo 3.1, plus YouTube & Music Premium.",
    longDescription: "Paket lengkap Family Member via invite. 5TB Storage di Photos/Drive/Gmail, 1000 AI Credits/bln, Gemini di Gmail/Docs, limit ekstra di NotebookLM.",
    category: "ai",
    fulfillmentType: "invite",
    sk: "Sejak Dec 12, 2025 Akses Gemini Pro akun wajib terverifikasi berusia 18+.",
    garansi: "STABLE — FULL GARANSI.",
    badge: "Best seller",
    accent: "#4285F4",
    icon: "G",
    isActive: true,
    sortOrder: 3,
    variants: [
      { id: "g1-yt-1m", productId: "g1-pro-yt", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 20000, priceIDR: 20000, isPromo: false, stock: 14, isActive: true, sortOrder: 1 },
      { id: "g1-yt-12m", productId: "g1-pro-yt", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 20000, priceIDR: 200000, isPromo: true, stock: 14, isActive: true, sortOrder: 2 }
    ],
    minPriceIDR: 20000,
    totalStock: 14,
    status: "available",
    delivery: "Invite email · 5–15 menit",
    licenseNote: "Akun baru atau perpanjang di akun sama",
    price: 20000
  }
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getFeaturedProducts(): Product[] {
  return products.slice(0, 3);
}

export function getRelatedProducts(product: Product): Product[] {
  return products.filter((p) => p.category === product.category && p.id !== product.id);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  );
}

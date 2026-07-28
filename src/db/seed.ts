/**
 * Catalog seed — idempotent upserts.
 *
 *   npm run db:seed
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const _url = process.env.DATABASE_URL?.trim() || "";
if (
  !_url ||
  _url.includes("USER:PASSWORD") ||
  _url.includes("ep-sample") ||
  _url.includes("ep-XXXX")
) {
  console.error(`
DATABASE_URL missing or still a placeholder in .env.local

Local quick start (Homebrew Postgres):
  brew services start postgresql@16
  createdb hyarax_apps
  DATABASE_URL=postgresql://$(whoami)@localhost:5432/hyarax_apps

Or Neon: https://console.neon.tech → Connection string
`);
  process.exit(1);
}

function isNeonUrl(url: string): boolean {
  return /neon\.tech/i.test(url) || /neon\.database/i.test(url);
}

function createSeedDb() {
  if (isNeonUrl(_url)) {
    return drizzleHttp(neon(_url), { schema });
  }
  return drizzlePg(new pg.Pool({ connectionString: _url }), { schema });
}

const db = createSeedDb();

/** Canonical pool stock per product (NOT sum of variants). */
const POOL_STOCK: Record<string, number> = {
  "yt-premium": 52,
  "ms-365": 4,
  "g1-pro-yt": 14,
  "g1-pro-no-yt": 20,
  "canva-biz": 97,
  "capcut-pro": 2,
  "netflix-uhd": 4,
  "disney-hotstar": 5,
  "alight-motion": 7,
};

const seedProducts = [
  {
    id: "yt-premium",
    slug: "youtube-premium-member",
    name: "YouTube Premium Member",
    category: "media",
    fulfillmentType: "invite" as const,
    description: "Paket Family Member via invite link ke akun Google Anda.",
    longDescription:
      "Bisa perpanjangan tiap bulan di akun yang sama. Privacy aman, Family hanya berbagi benefits tidak berbagi riwayat atau preferensi tayangan.",
    sk: "Perpanjangan akun sama. Bebas iklan di YouTube & YouTube Music.",
    garansi: "FULL GARANSI jika premium hilang atau keluarga kena disable.",
    badge: null as string | null,
    accent: "#FF0000",
    icon: "Y",
    sortOrder: 1,
  },
  {
    id: "ms-365",
    slug: "microsoft-365-member",
    name: "Microsoft 365 Family Member",
    category: "productivity",
    fulfillmentType: "invite" as const,
    description: "1 TB Storage OneDrive, Copilot 365, Word, Excel, PowerPoint.",
    longDescription:
      "Paket Family Member via invite ke akun Microsoft Anda. Unlock semua software/aplikasi 365 di Android/iOS/Mac/Windows.",
    sk: "Unlock Word, Excel, PowerPoint, OneNote, Designer, Clipchamp, Copilot di Outlook/Word.",
    garansi: "FULL GARANSI jika lisensi/stok mati sebelum waktunya.",
    badge: "Popular",
    accent: "#0078D4",
    icon: "M",
    sortOrder: 2,
  },
  {
    id: "g1-pro-yt",
    slug: "google-one-pro-yt",
    name: "Google One Pro (+YT & Music)",
    category: "ai",
    fulfillmentType: "invite" as const,
    description: "5TB Storage, Gemini 3 Pro, Veo 3.1, plus YouTube & Music Premium.",
    longDescription:
      "Paket lengkap Family Member via invite. 5TB Storage di Photos/Drive/Gmail, 1000 AI Credits/bln.",
    sk: "Akses Gemini Pro akun wajib terverifikasi berusia 18+ jika diminta.",
    garansi: "STABLE — FULL GARANSI.",
    badge: "Best seller",
    accent: "#4285F4",
    icon: "G",
    sortOrder: 3,
  },
  {
    id: "g1-pro-no-yt",
    slug: "google-one-pro-no-yt",
    name: "Google One Pro (tanpa YT)",
    category: "ai",
    fulfillmentType: "invite" as const,
    description: "Mode hemat 5TB Storage + Gemini 3 Pro tanpa YouTube Premium.",
    longDescription: "Untuk yang butuh Google One 5TB & fitur AI Pro tanpa YouTube Premium.",
    sk: "Akses Gemini Pro butuh verifikasi 18+ jika diminta.",
    garansi: "STABLE — FULL GARANSI.",
    badge: null,
    accent: "#34A853",
    icon: "G",
    sortOrder: 4,
  },
  {
    id: "canva-biz",
    slug: "canva-business",
    name: "Canva Business",
    category: "design",
    fulfillmentType: "invite" as const,
    description: "Fitur Pro & Designer via invite link tim bisnis.",
    longDescription: "Akses Canva Pro + Designer via invite link.",
    sk: "Akses via invite link. Garansi selama masa langganan.",
    garansi: "FULL GARANSI.",
    badge: "Hot",
    accent: "#00C4CC",
    icon: "C",
    sortOrder: 5,
  },
  {
    id: "capcut-pro",
    slug: "capcut-pro-private",
    name: "CapCut Pro Private",
    category: "media",
    fulfillmentType: "credential" as const,
    description: "Akun private. Android/Desktop max 2-3 device.",
    longDescription: "Akun private dari seller. Jangan multi-device berlebihan.",
    sk: "iOS jangan login di >1 device. Android/Desktop max 2-3 device.",
    garansi: "GARANSI jika tidak PRO (tanya stok dulu saat klaim).",
    badge: null,
    accent: "#000000",
    icon: "C",
    sortOrder: 6,
  },
  {
    id: "netflix-uhd",
    slug: "netflix-premium-uhd",
    name: "Netflix Premium UHD (1P1U)",
    category: "media",
    fulfillmentType: "credential" as const,
    description: "1 Profil 1 User 4K UHD 1 Bulan.",
    longDescription: "Satu profil khusus untuk satu pengguna. Kualitas 4K UHD.",
    sk: "1 profil 1 user. Dilarang ubah PIN/profil lain.",
    garansi: "FULL GARANSI jika kena blok login.",
    badge: null,
    accent: "#E50914",
    icon: "N",
    sortOrder: 7,
  },
  {
    id: "disney-hotstar",
    slug: "disney-hotstar-premium",
    name: "Disney+ Hotstar Premium Sharing",
    category: "media",
    fulfillmentType: "credential" as const,
    description: "Sharing 1 Device 4K UHD 1 Bulan.",
    longDescription: "Akun sharing. Plan Premium 4K UHD.",
    sk: "Login 1 device saja.",
    garansi: "FULL GARANSI sesuai S&K produk.",
    badge: null,
    accent: "#113CCF",
    icon: "D",
    sortOrder: 8,
  },
  {
    id: "alight-motion",
    slug: "alight-motion-pro",
    name: "Alight Motion Pro Private",
    category: "design",
    fulfillmentType: "credential" as const,
    description: "Private account 12 Bulan.",
    longDescription: "Akun private dari seller untuk 12 bulan penuh.",
    sk: "Gunakan sesuai S&K.",
    garansi: "GARANSI back free 1 bulan.",
    badge: null,
    accent: "#6C5CE7",
    icon: "A",
    sortOrder: 9,
  },
];

type V = {
  id: string;
  productId: string;
  label: string;
  durationMonths?: number;
  durationDays?: number;
  priceMonthlyIDR?: number;
  priceIDR: number;
  isPromo: boolean;
  sortOrder: number;
};

const seedVariants: V[] = [
  { id: "yt-1m", productId: "yt-premium", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 8000, priceIDR: 8000, isPromo: false, sortOrder: 1 },
  { id: "yt-12m", productId: "yt-premium", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 8000, priceIDR: 55000, isPromo: true, sortOrder: 2 },
  { id: "ms-1m", productId: "ms-365", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 10000, priceIDR: 10000, isPromo: false, sortOrder: 1 },
  { id: "ms-12m", productId: "ms-365", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 10000, priceIDR: 50000, isPromo: true, sortOrder: 2 },
  { id: "g1-yt-1m", productId: "g1-pro-yt", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 20000, priceIDR: 20000, isPromo: false, sortOrder: 1 },
  { id: "g1-yt-12m", productId: "g1-pro-yt", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 20000, priceIDR: 200000, isPromo: true, sortOrder: 2 },
  { id: "g1-noyt-1m", productId: "g1-pro-no-yt", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 10000, priceIDR: 10000, isPromo: false, sortOrder: 1 },
  { id: "g1-noyt-12m", productId: "g1-pro-no-yt", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 10000, priceIDR: 130000, isPromo: true, sortOrder: 2 },
  { id: "canva-1m", productId: "canva-biz", label: "1 Bulan", durationMonths: 1, priceMonthlyIDR: 8000, priceIDR: 8000, isPromo: false, sortOrder: 1 },
  { id: "canva-12m", productId: "canva-biz", label: "12 Bulan Promo", durationMonths: 12, priceMonthlyIDR: 8000, priceIDR: 55000, isPromo: true, sortOrder: 2 },
  { id: "capcut-7d", productId: "capcut-pro", label: "7 Hari", durationDays: 7, priceIDR: 15000, isPromo: false, sortOrder: 1 },
  { id: "capcut-1m", productId: "capcut-pro", label: "1 Bulan", durationMonths: 1, priceIDR: 35000, isPromo: false, sortOrder: 2 },
  { id: "netflix-1m", productId: "netflix-uhd", label: "1 Bulan", durationMonths: 1, priceIDR: 35000, isPromo: false, sortOrder: 1 },
  { id: "disney-1m", productId: "disney-hotstar", label: "1 Bulan", durationMonths: 1, priceIDR: 25000, isPromo: false, sortOrder: 1 },
  { id: "alight-12m", productId: "alight-motion", label: "12 Bulan", durationMonths: 12, priceIDR: 10000, isPromo: false, sortOrder: 1 },
];

const seedSettingsDev = [
  { key: "bca_name", value: "DEV PLACEHOLDER" },
  { key: "bca_number", value: "0000000000" },
  { key: "seabank_name", value: "DEV PLACEHOLDER" },
  { key: "seabank_number", value: "0000000000" },
  { key: "qris_string", value: "" },
  { key: "admin_wa", value: "6280000000000" },
  { key: "maintenance_mode", value: "false" },
];

async function runSeed() {
  console.log("Seeding catalog + inventory pools...");

  for (const p of seedProducts) {
    await db
      .insert(schema.products)
      .values({ ...p, isActive: true })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          slug: p.slug,
          name: p.name,
          category: p.category,
          fulfillmentType: p.fulfillmentType,
          description: p.description,
          longDescription: p.longDescription,
          sk: p.sk,
          garansi: p.garansi,
          badge: p.badge,
          accent: p.accent,
          icon: p.icon,
          sortOrder: p.sortOrder,
          isActive: true,
        },
      });

    const poolId = `pool-${p.id}`;
    const stock = POOL_STOCK[p.id] ?? 0;
    await db
      .insert(schema.inventoryPools)
      .values({
        id: poolId,
        productId: p.id,
        availableStock: stock,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.inventoryPools.id,
        set: {
          availableStock: stock,
          updatedAt: new Date(),
        },
      });
  }

  for (const v of seedVariants) {
    const poolId = `pool-${v.productId}`;
    const poolStock = POOL_STOCK[v.productId] ?? 0;
    await db
      .insert(schema.productVariants)
      .values({
        id: v.id,
        productId: v.productId,
        inventoryPoolId: poolId,
        label: v.label,
        durationDays: v.durationDays ?? null,
        durationMonths: v.durationMonths ?? null,
        priceMonthlyIDR: v.priceMonthlyIDR ?? null,
        priceIDR: v.priceIDR,
        isPromo: v.isPromo,
        stock: poolStock,
        isActive: true,
        sortOrder: v.sortOrder,
      })
      .onConflictDoUpdate({
        target: schema.productVariants.id,
        set: {
          inventoryPoolId: poolId,
          label: v.label,
          durationDays: v.durationDays ?? null,
          durationMonths: v.durationMonths ?? null,
          priceMonthlyIDR: v.priceMonthlyIDR ?? null,
          priceIDR: v.priceIDR,
          isPromo: v.isPromo,
          stock: poolStock,
          isActive: true,
          sortOrder: v.sortOrder,
        },
      });
  }

  if (process.env.SEED_DEV_SETTINGS === "1") {
    for (const s of seedSettingsDev) {
      await db
        .insert(schema.adminSettings)
        .values({ key: s.key, value: s.value, updatedAt: new Date() })
        .onConflictDoNothing();
    }
    console.log("Dev settings placeholders seeded (SEED_DEV_SETTINGS=1).");
  }

  const count = await db.select({ id: schema.products.id }).from(schema.products);
  console.log(`Seed OK: ${count.length} products, pools linked.`);
  process.exit(0);
}

runSeed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

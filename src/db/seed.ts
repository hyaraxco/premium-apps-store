import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL || "");
const db = drizzle(sql, { schema });

const seedProducts = [
  {
    id: "yt-premium",
    slug: "youtube-premium-member",
    name: "YouTube Premium Member",
    category: "media",
    fulfillmentType: "invite",
    description: "Paket Family Member via invite link ke akun Google Anda.",
    longDescription:
      "Bisa perpanjangan tiap bulan di akun yang sama. Privacy aman, Family hanya berbagi benefits tidak berbagi riwayat atau preferensi tayangan.",
    sk: "Perpanjangan akun sama. Bebas iklan di YouTube & YouTube Music.",
    garansi: "FULL GARANSI jika premium hilang atau keluarga kena disable.",
    badge: undefined,
    accent: "#FF0000",
    icon: "Y",
    sortOrder: 1,
  },
  {
    id: "ms-365",
    slug: "microsoft-365-member",
    name: "Microsoft 365 Family Member",
    category: "productivity",
    fulfillmentType: "invite",
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
    fulfillmentType: "invite",
    description: "5TB Storage, Gemini 3 Pro, Veo 3.1, plus YouTube & Music Premium.",
    longDescription:
      "Paket lengkap Family Member via invite. 5TB Storage di Photos/Drive/Gmail, 1000 AI Credits/bln, Gemini di Gmail/Docs, limit ekstra di NotebookLM.",
    sk: "Sejak Dec 12, 2025 Akses Gemini Pro akun wajib terverifikasi berusia 18+. YouTube & 5TB tetap aktif meski belum verif.",
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
    fulfillmentType: "invite",
    description: "Mode hemat 5TB Storage + Gemini 3 Pro tanpa YouTube Premium.",
    longDescription:
      "Untuk yang butuh Google One 5TB Storage & fitur AI Pro saja tanpa paket YouTube Premium.",
    sk: "Akses Gemini Pro butuh verifikasi 18+ jika diminta.",
    garansi: "STABLE — FULL GARANSI.",
    badge: undefined,
    accent: "#34A853",
    icon: "G",
    sortOrder: 4,
  },
  {
    id: "canva-biz",
    slug: "canva-business",
    name: "Canva Business",
    category: "design",
    fulfillmentType: "invite",
    description: "Fitur Pro & Designer via invite link tim bisnis.",
    longDescription:
      "Akses semua fitur Canva Pro + Designer via invite link. Cocok untuk desainer & tim konten.",
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
    fulfillmentType: "credential",
    description: "Akun private khusus untuk Anda. Login Android/Desktop max 2-3 device.",
    longDescription:
      "Akun private dari seller. Jangan login lebih dari 3 device atau iOS multi-device (bisa limit/suspicious activity).",
    sk: "iOS jangan login di >1 device. Android/Desktop max 2-3 device.",
    garansi: "GARANSI jika tidak PRO (tanya stok dulu saat klaim).",
    badge: undefined,
    accent: "#000000",
    icon: "C",
    sortOrder: 6,
  },
  {
    id: "netflix-uhd",
    slug: "netflix-premium-uhd",
    name: "Netflix Premium UHD (1P1U)",
    category: "media",
    fulfillmentType: "credential",
    description: "1 Profil 1 User 4K UHD 1 Bulan.",
    longDescription:
      "Satu profil khusus untuk satu pengguna. Kualitas tayangan 4K UHD. Legal bill Indonesia.",
    sk: "1 profil 1 user. Dilarang ubah PIN/profil lain.",
    garansi: "FULL GARANSI jika kena blok login.",
    badge: undefined,
    accent: "#E50914",
    icon: "N",
    sortOrder: 7,
  },
  {
    id: "disney-hotstar",
    slug: "disney-hotstar-premium",
    name: "Disney+ Hotstar Premium Sharing",
    category: "media",
    fulfillmentType: "credential",
    description: "Sharing 1 Device 4K UHD 1 Bulan.",
    longDescription:
      "Akun dipake bersama buyer lain. Plan Premium 4K UHD. Legal bill Indonesia.",
    sk: "Login 1 device saja.",
    garansi: "FULL GARANSI — LEGAL BILL INDONESIA.",
    badge: undefined,
    accent: "#113CCF",
    icon: "D",
    sortOrder: 8,
  },
  {
    id: "alight-motion",
    slug: "alight-motion-pro",
    name: "Alight Motion Pro Private",
    category: "design",
    fulfillmentType: "credential",
    description: "Private account 12 Bulan.",
    longDescription: "Akun private dari seller untuk 12 bulan penuh.",
    sk: "Gunakan sesuai TOS.",
    garansi: "GARANSI back free 1 bulan.",
    badge: undefined,
    accent: "#6C5CE7",
    icon: "A",
    sortOrder: 9,
  },
];

const seedVariants = [
  // YT Premium Member (stok total 52)
  {
    id: "yt-1m",
    productId: "yt-premium",
    label: "1 Bulan",
    durationMonths: 1,
    priceMonthlyIDR: 8000,
    priceIDR: 8000,
    isPromo: false,
    stock: 52,
    sortOrder: 1,
  },
  {
    id: "yt-12m",
    productId: "yt-premium",
    label: "12 Bulan Promo",
    durationMonths: 12,
    priceMonthlyIDR: 8000,
    priceIDR: 55000,
    isPromo: true,
    stock: 52,
    sortOrder: 2,
  },

  // MS365 (stok total 4)
  {
    id: "ms-1m",
    productId: "ms-365",
    label: "1 Bulan",
    durationMonths: 1,
    priceMonthlyIDR: 10000,
    priceIDR: 10000,
    isPromo: false,
    stock: 4,
    sortOrder: 1,
  },
  {
    id: "ms-12m",
    productId: "ms-365",
    label: "12 Bulan Promo",
    durationMonths: 12,
    priceMonthlyIDR: 10000,
    priceIDR: 50000,
    isPromo: true,
    stock: 4,
    sortOrder: 2,
  },

  // G1 Pro + YT (stok total 14)
  {
    id: "g1-yt-1m",
    productId: "g1-pro-yt",
    label: "1 Bulan",
    durationMonths: 1,
    priceMonthlyIDR: 20000,
    priceIDR: 20000,
    isPromo: false,
    stock: 14,
    sortOrder: 1,
  },
  {
    id: "g1-yt-12m",
    productId: "g1-pro-yt",
    label: "12 Bulan Promo",
    durationMonths: 12,
    priceMonthlyIDR: 20000,
    priceIDR: 200000,
    isPromo: true,
    stock: 14,
    sortOrder: 2,
  },

  // G1 Pro no YT (stok 20)
  {
    id: "g1-noyt-1m",
    productId: "g1-pro-no-yt",
    label: "1 Bulan",
    durationMonths: 1,
    priceMonthlyIDR: 10000,
    priceIDR: 10000,
    isPromo: false,
    stock: 20,
    sortOrder: 1,
  },
  {
    id: "g1-noyt-12m",
    productId: "g1-pro-no-yt",
    label: "12 Bulan Promo",
    durationMonths: 12,
    priceMonthlyIDR: 10000,
    priceIDR: 130000,
    isPromo: true,
    stock: 20,
    sortOrder: 2,
  },

  // Canva Business (stok 97)
  {
    id: "canva-1m",
    productId: "canva-biz",
    label: "1 Bulan",
    durationMonths: 1,
    priceMonthlyIDR: 8000,
    priceIDR: 8000,
    isPromo: false,
    stock: 97,
    sortOrder: 1,
  },
  {
    id: "canva-12m",
    productId: "canva-biz",
    label: "12 Bulan Promo",
    durationMonths: 12,
    priceMonthlyIDR: 8000,
    priceIDR: 55000,
    isPromo: true,
    stock: 97,
    sortOrder: 2,
  },

  // CapCut Pro Private (stok 2)
  {
    id: "capcut-7d",
    productId: "capcut-pro",
    label: "7 Hari",
    durationDays: 7,
    priceIDR: 15000,
    isPromo: false,
    stock: 2,
    sortOrder: 1,
  },
  {
    id: "capcut-1m",
    productId: "capcut-pro",
    label: "1 Bulan",
    durationMonths: 1,
    priceIDR: 35000,
    isPromo: false,
    stock: 2,
    sortOrder: 2,
  },

  // Netflix (stok 4)
  {
    id: "netflix-1m",
    productId: "netflix-uhd",
    label: "1 Bulan",
    durationMonths: 1,
    priceIDR: 35000,
    isPromo: false,
    stock: 4,
    sortOrder: 1,
  },

  // Disney+ (stok 5)
  {
    id: "disney-1m",
    productId: "disney-hotstar",
    label: "1 Bulan",
    durationMonths: 1,
    priceIDR: 25000,
    isPromo: false,
    stock: 5,
    sortOrder: 1,
  },

  // Alight Motion (stok 7)
  {
    id: "alight-12m",
    productId: "alight-motion",
    label: "12 Bulan",
    durationMonths: 12,
    priceIDR: 10000,
    isPromo: false,
    stock: 7,
    sortOrder: 1,
  },
];

const seedSettings = [
  { key: "bca_name", value: "WARUNG BU DIR" },
  { key: "bca_number", value: "1234567890" },
  { key: "seabank_name", value: "WARUNG BU DIR" },
  { key: "seabank_number", value: "9876543210" },
  {
    key: "qris_string",
    value:
      "00020101021126590014ID.LINKAJA.WWW01189360091400000000000215ID10254005290260303A0151440014ID.GPN.WWW02150000000000000005204581253033605802ID5921WARUNG BU DIR, TJHALANG6007BANDUNG61054011562070703A016304",
  },
  { key: "admin_wa", value: "6281234567890" },
  { key: "maintenance_mode", value: "false" },
];

async function runSeed() {
  console.log("Seeding Database...");
  for (const p of seedProducts) {
    await db.insert(schema.products).values(p).onConflictDoNothing();
  }
  for (const v of seedVariants) {
    await db.insert(schema.productVariants).values(v).onConflictDoNothing();
  }
  for (const s of seedSettings) {
    await db.insert(schema.adminSettings).values(s).onConflictDoNothing();
  }
  console.log("Database Seeded Successfully!");
}

runSeed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

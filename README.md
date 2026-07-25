# Stackbay — Premium Apps Store

Storefront e-commerce sederhana untuk katalog **aplikasi premium & subscription** (Notion, Figma, ChatGPT, Copilot, Adobe, dll.).

## Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- Cart state: React Context + `localStorage` (client-side)

## Fitur

- Beranda editorial + kategori + pilihan editor
- Katalog dengan filter kategori & pencarian
- Detail produk (harga IDR, billing, fitur, status stok)
- Keranjang + checkout demo (validasi form, tanpa payment gateway)
- Halaman cara kerja & FAQ
- UI bahasa Indonesia, a11y dasar (label, focus, reduced motion)

## Menjalankan

```bash
cd premium-apps-store
bun install   # atau npm install
bun dev       # atau npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur

```
src/
  app/           # routes (page, layout)
  components/    # UI + cart/checkout
  lib/           # products data, cart context, format
  types/         # Product types
```

## Catatan

Ini **demo storefront**. Bukan toko resmi vendor. Untuk produksi: hubungkan payment gateway, CMS/DB, auth, dan pastikan model lisensi legal.

## Scripts

| Command     | Deskripsi        |
|-------------|------------------|
| `bun dev`   | Development      |
| `bun build` | Production build |
| `bun start` | Serve build      |
| `bun lint`  | ESLint           |

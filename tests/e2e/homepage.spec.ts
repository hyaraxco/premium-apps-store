import { test, expect } from "@playwright/test";
import { categories } from "../../src/lib/products";

/**
 * Data-truth homepage: katalog dirender dari DB (bukan fallback hardcoded).
 * Invariant yang dijaga:
 *  - Homepage memuat produk dari DB dan featured dibatasi 6.
 *  - Setiap "stamp" pada kartu produk adalah vocabulary yang dikenal
 *    (badge, kategori, stok, tipe fulfillment) — mencegah badge liar.
 *  - Produk di homepage selalu subset dari katalog.
 */

const BADGE_VOCAB = new Set(["Best seller", "Segera habis", "Hot", "Baru", "Popular"]);
const FULFILLMENT_VOCAB = new Set(["Invite", "Private/Sharing"]);
const categoryLabels = new Set(categories.map((c) => c.label));
// StatusMeta renders e.g. "Siap kirim · Invite email · 5–15 menit"
const STATUS_PATTERN = /^(Siap kirim|Stok terbatas|Pre-order|Stok habis)( · .+)?$/;

function isAllowedStamp(text: string): boolean {
  return (
    BADGE_VOCAB.has(text) ||
    categoryLabels.has(text) ||
    FULFILLMENT_VOCAB.has(text) ||
    STATUS_PATTERN.test(text) ||
    /^Stok \d+$/.test(text)
  );
}

async function collectProductHrefs(page: import("@playwright/test").Page) {
  const hrefs = await page.locator('article a[href^="/apps/"]').evaluateAll((links) =>
    links.map((l) => (l as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  return [...new Set(hrefs)].filter(Boolean);
}

test.describe("Homepage data-truth", () => {
  test("homepage menampilkan produk dari DB (featured ≤ 6)", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator('article a[href^="/apps/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(6);

    // Setiap kartu punya info harga + stok (data lengkap dari DB)
    await expect(cards.first().getByText("Mulai")).toBeVisible();
    await expect(cards.first().getByText(/^Rp\s/)).toBeVisible();
    await expect(cards.first().getByText(/Stok \d+/)).toBeVisible();
  });

  test("produk di homepage selalu tampil di katalog", async ({ page }) => {
    await page.goto("/");
    const homeHrefs = await collectProductHrefs(page);
    expect(homeHrefs.length).toBeGreaterThan(0);

    await page.goto("/katalog");
    const katalogHrefs = await collectProductHrefs(page);
    for (const href of homeHrefs) {
      expect(katalogHrefs).toContain(href);
    }
  });

  test("semua stamp pada kartu katalog adalah vocabulary yang dikenal", async ({
    page,
  }) => {
    await page.goto("/katalog");

    const cards = page.locator("article");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    const stamps = await cards.locator(".stamp").allTextContents();
    const unknown = stamps.map((s) => s.trim()).filter((s) => !isAllowedStamp(s));
    expect(unknown).toEqual([]);
  });

test("produk seed (YouTube Premium) tampil di katalog", async ({ page }) => {
  await page.goto("/katalog");
  await expect(page.locator('a[href="/apps/youtube-premium-member"]')).toBeVisible();
});
});

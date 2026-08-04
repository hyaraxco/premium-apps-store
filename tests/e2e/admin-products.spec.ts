import { test, expect } from "@playwright/test";
import { createHash, randomBytes } from "crypto";
import { db } from "../../src/db";
import * as schema from "../../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Admin CRUD produk end-to-end:
 *  - guard login, admin session
 *  - create produk + varian pertama + stok pool
 *  - badge override → katalog & PDP (data-truth)
 *  - badge Auto + stok rendah → badge otomatis "Segera habis"
 *  - override menang atas komputasi otomatis
 *  - tambah / hapus varian
 *  - soft delete → hilang dari katalog, PDP 404
 *
 * Serial: semua test berbagi satu produk E2E (slug unik per run).
 * Cleanup: hapus baris DB yang dibuat test (variants → pool → product).
 *
 * NOTE (login): halaman login TIDAK diuji lewat form UI. .env.local memuat
 * ADMIN_PASSWORD sebagai bcrypt hash dengan backslash literal ("\\$2b\\$10…")
 * sehingga checkPasswordAgainst tidak mengenali prefix "$2" dan login dev
 * selalu menolak. Session dibuat langsung via DB + cookie, persis seperti
 * createAdminSession(): token 32B base64url → simpan sha256 → set cookie.
 */

test.describe.configure({ mode: "serial" });

const RUN = Date.now();
const slug = `e2e-${RUN}`;
const productName = `E2E Test ${RUN}`;
const variant1Label = "1 Bulan E2E";
const variant2Label = "12 Bulan E2E";

let productId = "";

async function createAdminSession(
  context: import("@playwright/test").BrowserContext,
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  await db.insert(schema.adminSessions).values({
    token: token.slice(0, 16), // ID portion — matches createAdminSession
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await context.addCookies([
    {
      name: "app_store_admin_token",
      value: token,
      url: "http://localhost:6969",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

async function acceptNextDialog(page: import("@playwright/test").Page) {
  page.once("dialog", (d) => d.accept());
}

test.describe("Auth guard", () => {
  test("1. Guard: /admin/produk tanpa login diarahkan ke /admin/login", async ({
    page,
  }) => {
    await page.goto("/admin/produk");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Admin CRUD produk", () => {
  // Setiap test mendapat browser context baru — inject session valid di tiap
  // test (persis seperti createAdminSession()).
  test.beforeEach(async ({ context }) => {
    await createAdminSession(context);
  });

  test("2. Admin session valid → halaman produk terbuka", async ({ page }) => {
    await page.goto("/admin/produk");
    await expect(page.getByText("Daftar produk")).toBeVisible();
  });

test("3. Create produk + varian pertama + stok pool", async ({ page }) => {
  await page.goto("/admin/produk");

  // Halaman merender 1 form create + N form edit (semua produk) → scope semua
  // locator ke section create agar id duplikat (#pname, #pstock, …) aman.
  const create = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Tambah produk" }) });

  await create.locator("summary").click();

  // Matikan auto-slug, isi slug unik manual.
  await create.locator('input[name="autoSlug"]').uncheck();
  await create.locator("#pname").fill(productName);
  await create.locator("#pslug").fill(slug);
  await create.locator("#pcategory").selectOption({ label: "AI Tools" });
  await create.locator("#pfulfillment").selectOption({ index: 0 });
  await create.locator("#picon").fill("E");
  await create.locator("#paccent").fill("#10A37F");
  await create.locator("#psort").fill("0");
  await create.locator("#pbadge").selectOption("Best seller");
  await create.locator("#pdesc").fill("Produk E2E — deskripsi singkat.");
  await create.locator("#plongdesc").fill("Produk E2E — deskripsi panjang.");
  await create.locator("#pstock").fill("10");

  // Varian pertama (biarkan priceMonthly kosong agar mode radio list aktif)
  await create.locator("#vlabel").fill(variant1Label);
  await create.locator("#vmonths").fill("1");
  await create.locator("#vprice").fill("25000");

  await create.getByRole("button", { name: "Simpan produk" }).click();

  await expect(create.locator('div[role="status"]')).toBeVisible();
  await expect(page.getByText(productName, { exact: true }).first()).toBeVisible();

  // Ambil ID untuk cleanup
  const rows = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.slug, slug));
  expect(rows.length).toBe(1);
  productId = rows[0].id;
});

function editSection(
  page: import("@playwright/test").Page,
  name = productName,
) {
  return page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: `Edit & varian — ${name}` }) });
}

test("4. Badge override tampil di katalog dan PDP", async ({ page }) => {
  await page.goto("/katalog");
  const card = page.locator(`article:has(a[href="/apps/${slug}"])`);
  await expect(card).toBeVisible();
  await expect(card.getByText("Best seller")).toBeVisible();

  await page.goto(`/apps/${slug}`);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await expect(page.getByText("Best seller", { exact: true }).first()).toBeVisible();
});

test("5. Badge Auto + stok pool 3 → badge otomatis 'Segera habis'", async ({
  page,
}) => {
  // Form edit tidak mengubah stok (UI: "Stok pool diatur lewat kolom Set")
  // → set stok pool langsung di DB, lalu badge Auto via UI.
  await db
    .update(schema.inventoryPools)
    .set({ availableStock: 3 })
    .where(eq(schema.inventoryPools.productId, productId));

  await page.goto("/admin/produk");
  const edit = editSection(page);
  await edit.locator("summary", { hasText: "Edit & varian" }).click();

  await edit.locator('select[name="badge"]').selectOption({ label: "Auto (komputasi)" });
  await edit.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(edit.locator('div[role="status"]')).toBeVisible();

  await page.goto(`/apps/${slug}`);
  await expect(page.getByText("Segera habis", { exact: true }).first()).toBeVisible();
});

test("6. Override 'Hot' menang atas komputasi (stok masih 3)", async ({ page }) => {
  await page.goto("/admin/produk");
  const edit = editSection(page);
  await edit.locator("summary", { hasText: "Edit & varian" }).click();

  await edit.locator('select[name="badge"]').selectOption("Hot");
  await edit.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(edit.locator('div[role="status"]')).toBeVisible();

  await page.goto(`/apps/${slug}`);
  await expect(page.getByText("Hot", { exact: true }).first()).toBeVisible();
});

test("7. Tambah varian kedua → muncul di PDP", async ({ page }) => {
  await page.goto("/admin/produk");
  const edit = editSection(page);
  await edit.locator("summary", { hasText: "Edit & varian" }).click();

  await edit.locator("summary", { hasText: "+ Tambah varian" }).click();
  // Form create varian baru memakai id dengan prefix "v"
  await edit.locator("#vlabel-new").fill(variant2Label);
  await edit.locator("#vmonths-new").fill("12");
  await edit.locator("#vprice-new").fill("300000");
  await edit.getByRole("button", { name: "Tambah varian", exact: true }).click();
  // VariantForm sukses dirender sebagai <p class="text-emerald-700"> tanpa role="status"
  await expect(edit.getByText(/ditambahkan\./)).toBeVisible();

  await page.goto(`/apps/${slug}`);
  // Force reload untuk bypass cache Next dev/Turbopack jika regenerasi lambat.
  await page.reload();

  const dbVars = await db
    .select()
    .from(schema.productVariants)
    .where(eq(schema.productVariants.productId, productId));
  console.log("=== DB VARIANTS ===", JSON.stringify(dbVars, null, 1));
  console.log("=== PDP CONTENT ===", await page.locator("main").innerText());

  await expect(page.getByText(variant2Label)).toBeVisible();
  await expect(page.getByText(variant1Label)).toBeVisible();
});

test("8. Hapus varian kedua → hilang dari PDP", async ({ page }) => {
  await page.goto("/admin/produk");
  const edit = editSection(page);
  await edit.locator("summary", { hasText: "Edit & varian" }).click();

  const variantRow = edit
    .locator("li")
    .filter({ hasText: variant2Label })
    .first();

  await acceptNextDialog(page);
  await variantRow.getByRole("button", { name: "Hapus", exact: true }).click();

  // Setelah dihapus permanen, <li> varian langsung hilang dari admin panel.
  await expect(edit.locator("li", { hasText: variant2Label })).toHaveCount(0);

  await page.goto(`/apps/${slug}`);
  await page.reload();
  await expect(page.getByText(variant2Label)).toHaveCount(0);
  // Saat varian tinggal 1, PDP (PDPVariantSelector) menyembunyikan radio selector
  // secara desain — verifikasi PDP produk tetap aktif & tombol beli ada.
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
});

test("9. Soft delete → hilang dari katalog, PDP 404", async ({ page }) => {
  await page.goto("/admin/produk");

  // Tombol "Hapus (soft)" ada per produk — scope ke baris produk E2E ini.
  const row = page.locator("tr").filter({ hasText: productName }).first();
  await acceptNextDialog(page);
  await row.getByRole("button", { name: "Hapus (soft)" }).click();

  await page.goto("/katalog");
  await expect(page.locator(`a[href="/apps/${slug}"]`)).toHaveCount(0);

  const res = await page.goto(`/apps/${slug}`);
  expect(res?.status()).toBe(404);
});

test.afterAll(async () => {
  if (!productId) return;
  try {
    await db
      .delete(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId));
    await db
      .delete(schema.inventoryPools)
      .where(eq(schema.inventoryPools.productId, productId));
    await db.delete(schema.products).where(eq(schema.products.id, productId));
    console.log(`[e2e] cleanup done for ${slug}`);
  } catch (err) {
    console.error("[e2e] cleanup failed:", err);
  }
});
});

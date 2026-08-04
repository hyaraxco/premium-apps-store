import { test, expect } from "@playwright/test";
import { db } from "../../src/db";
import * as schema from "../../src/db/schema";
import { eq } from "drizzle-orm";

test.describe.configure({ mode: 'serial' });

test.describe("E2E Payment Status Flow", () => {
  let orderId: string;
  let orderTokenUrl: string;

  // Cleanup order after tests if needed
  test.afterAll(async () => {
    if (orderId) {
      // Opt out of cleanup to keep db seeded or perform specific cleanup
    }
  });

  test("1. Checkout new order (Status: Pending)", async ({ page }) => {
    // 1. Go to katalog
    await page.goto("/katalog");

    // 2. Select first product and add to cart
    await page.locator('a[href^="/apps/"]').first().click();
    await page.waitForURL("**/apps/**");
    await page.getByRole("button", { name: "Tambah ke keranjang" }).click();

    // 3. Go to cart and proceed to checkout
    await page.goto("/keranjang");
    await page.getByRole("link", { name: "Lanjut checkout" }).click();
    await page.waitForURL("**/checkout");

    // 4. Fill checkout form
    await page.fill('input[name="name"]', "E2E Tester");
    await page.fill('input[name="email"]', "tester@e2e.com");
    await page.fill('input[name="whatsapp"]', "08123456789");

    // Choose BCA
    await page.locator("label", { hasText: "BCA" }).click();

    // Submit
    await page.getByRole("button", { name: "Bayar Sekarang" }).click();

    // 5. Arrive at Success Page
    await page.waitForURL("**/checkout/sukses**");

    // Verify it shows BCA number (we assume the setting isn't seeded and uses default "1234567890", or we just look for BCA label)
    await expect(page.locator("text=TRANSFER BANK BCA")).toBeVisible();

    // 6. Click Lacak Status Order
    await page.getByRole("link", { name: /Lacak Status Order/i }).click();
    await page.waitForURL("**/order/**");

    orderTokenUrl = page.url();

    // Verify Pending Status
    await expect(page.getByText("Menunggu Pembayaran", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lanjutkan Pembayaran/i })).toBeVisible();

    // Get order ID from the page heading
    const idHeading = await page.locator("h1.font-mono").textContent();
    if (idHeading) {
      orderId = idHeading.trim();
    }
    expect(orderId).toContain("SB-");
  });

  test("2. Order becomes Paid", async ({ page }) => {
    // Update DB
    await db.update(schema.orders).set({ paymentStatus: "paid" }).where(eq(schema.orders.id, orderId));

    // Reload tracking page
    await page.goto(orderTokenUrl);

    // Verify
    await expect(page.getByText("Pembayaran Diverifikasi", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lanjutkan Pembayaran/i })).not.toBeVisible();
  });

  test("3. Order becomes Failed", async ({ page }) => {
    // Update DB
    await db.update(schema.orders).set({ paymentStatus: "failed" }).where(eq(schema.orders.id, orderId));

    // Reload tracking page
    await page.goto(orderTokenUrl);

    // Verify
    await expect(page.getByText("Gagal", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lanjutkan Pembayaran/i })).not.toBeVisible();
  });

  test("4. Order becomes Expired", async ({ page }) => {
    // Update DB to pending but expired
    const past = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    await db.update(schema.orders).set({ 
      paymentStatus: "pending",
      paymentExpiresAt: past 
    }).where(eq(schema.orders.id, orderId));

    // Reload tracking page
    await page.goto(orderTokenUrl);

    // Verify
    await expect(page.getByText("Dibatalkan / Expired", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lanjutkan Pembayaran/i })).not.toBeVisible();
  });
});

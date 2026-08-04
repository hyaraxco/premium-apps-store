import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  productFormSchema,
  variantFormSchema,
  BADGE_OVERRIDES,
  PRODUCT_CATEGORIES,
} from "../../src/lib/product-forms";

test("slugify: normalisasi dasar", () => {
  assert.equal(slugify("YouTube Premium Member"), "youtube-premium-member");
  assert.equal(slugify("  Canva Pro  (Annual)  "), "canva-pro-annual");
  assert.equal(slugify("UPPER CASE"), "upper-case");
  assert.equal(slugify("AI---Tools"), "ai-tools");
  assert.equal(slugify("-leading-"), "leading");
  assert.equal(slugify("a.b_c"), "abc");
  assert.equal(slugify(""), "");
});

test("productFormSchema: produk valid minimal", () => {
  const r = productFormSchema.safeParse({
    name: "Test Product",
    slug: "test-product",
    autoSlug: false,
    category: "ai",
    fulfillmentType: "invite",
    description: "Deskripsi singkat",
    longDescription: "Deskripsi panjang",
    accent: "#10A37F",
    icon: "E",
    badge: "",
    sortOrder: 0,
    isActive: true,
  });
  assert.equal(r.success, true);
});

test("productFormSchema: warna aksen menerima huruf kecil", () => {
  const r = productFormSchema.safeParse({
    name: "Test",
    slug: "test",
    autoSlug: false,
    category: "media",
    fulfillmentType: "credential",
    description: "d",
    longDescription: "l",
    accent: "#10a37f",
    icon: "YT",
    badge: "Hot",
    sortOrder: 0,
    isActive: false,
  });
  assert.equal(r.success, true);
});

test("productFormSchema: tolak input tidak valid", () => {
  const valid = {
    name: "Test",
    slug: "test",
    autoSlug: false,
    category: "ai",
    fulfillmentType: "invite",
    description: "d",
    longDescription: "l",
    accent: "#10A37F",
    icon: "E",
    badge: "",
    sortOrder: 0,
    isActive: true,
  };
  assert.equal(productFormSchema.safeParse({ ...valid, name: "" }).success, false);
  assert.equal(
    productFormSchema.safeParse({ ...valid, slug: "Test" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, slug: "a_b" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, accent: "red" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, accent: "#GGGGGG" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, icon: "abc" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, badge: "Populer" }).success,
    false,
  );
  assert.equal(
    productFormSchema.safeParse({ ...valid, category: "bogus" }).success,
    false,
  );
});

test("variantFormSchema: durasi bulan valid", () => {
  const r = variantFormSchema.safeParse({
    label: "1 Bulan",
    durationDays: null,
    durationMonths: 1,
    priceIDR: 25000,
    priceMonthlyIDR: 25000,
    isPromo: false,
    sortOrder: 1,
  });
  assert.equal(r.success, true);
});

test("variantFormSchema: durasi hari valid", () => {
  const r = variantFormSchema.safeParse({
    label: "30 Hari",
    durationDays: 30,
    durationMonths: null,
    priceIDR: 15000,
    priceMonthlyIDR: null,
    isPromo: false,
    sortOrder: 2,
  });
  assert.equal(r.success, true);
});

test("variantFormSchema: harga string dikoersi ke number", () => {
  const r = variantFormSchema.safeParse({
    label: "1 Bulan",
    durationDays: null,
    durationMonths: 1,
    priceIDR: "25000",
    priceMonthlyIDR: "",
    isPromo: false,
    sortOrder: 1,
  });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.priceIDR, 25000);
});

test("variantFormSchema: tolak durasi ganda / kosong", () => {
  const base = {
    label: "X",
    priceIDR: 10000,
    priceMonthlyIDR: null,
    isPromo: false,
    sortOrder: 1,
  };
  // keduanya terisi → error
  assert.equal(
    variantFormSchema.safeParse({
      ...base,
      durationDays: 30,
      durationMonths: 1,
    }).success,
    false,
  );
  // keduanya kosong → error
  assert.equal(
    variantFormSchema.safeParse({
      ...base,
      durationDays: null,
      durationMonths: null,
    }).success,
    false,
  );
});

test("variantFormSchema: tolak harga 0 / negatif", () => {
  const base = {
    label: "X",
    durationDays: 30,
    durationMonths: null,
    priceMonthlyIDR: null,
    isPromo: false,
    sortOrder: 1,
  };
  assert.equal(
    variantFormSchema.safeParse({ ...base, priceIDR: 0 }).success,
    false,
  );
  assert.equal(
    variantFormSchema.safeParse({ ...base, priceIDR: -5 }).success,
    false,
  );
});

test("konstanta: BADGE_OVERRIDES dan PRODUCT_CATEGORIES", () => {
  assert.deepEqual(BADGE_OVERRIDES, ["", "Segera habis", "Best seller", "Hot", "Baru"]);
  assert.ok(PRODUCT_CATEGORIES.includes("ai"));
  assert.ok(!(PRODUCT_CATEGORIES as readonly string[]).includes("all"));
});

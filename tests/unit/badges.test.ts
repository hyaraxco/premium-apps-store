import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBadge,
  BADGE_LOW_STOCK_THRESHOLD,
  BADGE_NEW_DAYS,
  BADGE_SALES_WINDOW_DAYS,
} from "../../src/lib/badges";

const DAY_MS = 24 * 60 * 60 * 1000;

function baseInput(overrides: Partial<Parameters<typeof computeBadge>[0]> = {}) {
  return {
    dbBadge: null,
    stock: 10,
    qtySold: 0,
    qtyRank: 99,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    now: new Date("2024-06-01T00:00:00Z"),
    ...overrides,
  };
}

test("konstanta ambang badge", () => {
  assert.equal(BADGE_LOW_STOCK_THRESHOLD, 5);
  assert.equal(BADGE_NEW_DAYS, 14);
  assert.equal(BADGE_SALES_WINDOW_DAYS, 30);
});

test("override admin menang atas semua kondisi", () => {
  assert.equal(
    computeBadge(baseInput({ dbBadge: "Hot", stock: 2, qtyRank: 1, qtySold: 50 })),
    "Hot",
  );
  // Bahkan saat stock 0 (out of stock) override tetap tampil.
  assert.equal(computeBadge(baseInput({ dbBadge: "Baru", stock: 0 })), "Baru");
});

test("dbBadge string kosong = fallthrough ke komputasi", () => {
  assert.equal(computeBadge(baseInput({ dbBadge: "", stock: 2 })), "Segera habis");
  assert.equal(
    computeBadge(baseInput({ dbBadge: "", stock: 10, qtyRank: 1, qtySold: 5 })),
    "Best seller",
  );
});

test("low stock: 1..4 → Segera habis", () => {
  assert.equal(computeBadge(baseInput({ stock: 1 })), "Segera habis");
  assert.equal(computeBadge(baseInput({ stock: 4 })), "Segera habis");
});

test("low stock: stock 0 dan 5 tidak menghasilkan Segera habis", () => {
  assert.notEqual(computeBadge(baseInput({ stock: 0 })), "Segera habis");
  assert.notEqual(computeBadge(baseInput({ stock: 5 })), "Segera habis");
});

test("best seller: rank 1 + qty > 0", () => {
  assert.equal(
    computeBadge(baseInput({ qtyRank: 1, qtySold: 1 })),
    "Best seller",
  );
  // rank 1 tanpa penjualan bukan best seller
  assert.notEqual(
    computeBadge(baseInput({ qtyRank: 1, qtySold: 0 })),
    "Best seller",
  );
  // stock 0 tetap bisa best seller (skip low-stock)
  assert.equal(
    computeBadge(baseInput({ stock: 0, qtyRank: 1, qtySold: 10 })),
    "Best seller",
  );
});

test("hot: hanya rank 2 dan 3", () => {
  assert.equal(computeBadge(baseInput({ qtyRank: 2, qtySold: 5 })), "Hot");
  assert.equal(computeBadge(baseInput({ qtyRank: 3, qtySold: 5 })), "Hot");
  assert.notEqual(computeBadge(baseInput({ qtyRank: 4, qtySold: 5 })), "Hot");
});

test("baru: dalam 14 hari dari now", () => {
  const recent = new Date("2024-05-25T00:00:00Z"); // 7 hari sebelum now
  assert.equal(computeBadge(baseInput({ createdAt: recent })), "Baru");

  const old = new Date("2024-05-10T00:00:00Z"); // 22 hari sebelum now
  assert.equal(computeBadge(baseInput({ createdAt: old })), null);
});

test("baru: boundary tepat 14 hari masih Baru", () => {
  const exactCutoff = new Date(
    new Date("2024-06-01T00:00:00Z").getTime() - BADGE_NEW_DAYS * DAY_MS,
  );
  assert.equal(computeBadge(baseInput({ createdAt: exactCutoff })), "Baru");
});

test("prioritas: low stock menang atas best seller", () => {
  assert.equal(
    computeBadge(baseInput({ stock: 2, qtyRank: 1, qtySold: 99 })),
    "Segera habis",
  );
});

test("prioritas: best seller menang atas hot dan baru", () => {
  const recent = new Date("2024-05-25T00:00:00Z");
  assert.equal(
    computeBadge(baseInput({ qtyRank: 1, qtySold: 5, createdAt: recent })),
    "Best seller",
  );
});

test("prioritas: hot menang atas baru", () => {
  const recent = new Date("2024-05-25T00:00:00Z");
  assert.equal(
    computeBadge(baseInput({ qtyRank: 2, qtySold: 5, createdAt: recent })),
    "Hot",
  );
});

test("prioritas: baru adalah tier terakhir", () => {
  const recent = new Date("2024-05-25T00:00:00Z");
  assert.equal(computeBadge(baseInput({ qtyRank: 4, createdAt: recent })), "Baru");
});

test("tanpa kondisi apa pun → null", () => {
  assert.equal(computeBadge(baseInput()), null);
});

/**
 * Pure badge computation — no server-only imports so it can be unit-tested
 * with node:test. The DB layer (src/db/queries.ts) imports from here.
 */

// Automatic badge thresholds — see computeBadge for priority order.
export const BADGE_LOW_STOCK_THRESHOLD = 5;
export const BADGE_NEW_DAYS = 14;
export const BADGE_SALES_WINDOW_DAYS = 30;

/**
 * Automatic badge — admin override (dbBadge) wins; else exactly one computed
 * badge by priority: low stock → best seller → hot → new.
 */
export function computeBadge(input: {
  dbBadge: string | null;
  stock: number;
  qtySold: number;
  qtyRank: number;
  createdAt: Date;
  now?: Date;
}): string | null {
  const { dbBadge, stock, qtySold, qtyRank, createdAt } = input;

  if (dbBadge !== null && dbBadge.length > 0) return dbBadge;

  if (stock >= 1 && stock < BADGE_LOW_STOCK_THRESHOLD) return "Segera habis";

  if (qtyRank === 1 && qtySold > 0) return "Best seller";

  if (qtyRank === 2 || qtyRank === 3) return "Hot";

  const newCutoffMs =
    (input.now ?? new Date()).getTime() - BADGE_NEW_DAYS * 24 * 60 * 60 * 1000;
  if (createdAt.getTime() >= newCutoffMs) return "Baru";

  return null;
}

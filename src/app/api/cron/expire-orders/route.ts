import { NextResponse } from "next/server";
import { expireUnpaidOrders } from "@/lib/orders/expire";

/**
 * Vercel Cron: expire unpaid orders past payment_expires_at.
 * Triggered every 5 minutes via vercel.json crons config.
 * Auth: CRON_SECRET env var checked against Authorization header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireUnpaidOrders(50);
    return NextResponse.json({
      ok: true,
      expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/expire-orders] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

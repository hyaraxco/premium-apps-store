import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const payFilter = searchParams.get("pay") || "all";
  const fulfillFilter = searchParams.get("fulfill") || "all";
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const conditions = [];
  if (payFilter !== "all") conditions.push(eq(schema.orders.paymentStatus, payFilter));
  if (fulfillFilter !== "all") conditions.push(eq(schema.orders.fulfillmentStatus, fulfillFilter));

  let rows =
    conditions.length > 0
      ? await db.select().from(schema.orders).where(and(...conditions)).orderBy(desc(schema.orders.createdAt))
      : await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));

  if (query) {
    rows = rows.filter((ord) => [ord.id, ord.buyerName, ord.buyerEmail].join(" ").toLowerCase().includes(query));
  }

  const headers = ["Order ID", "Pembeli", "Email", "WhatsApp", "Metode", "Total IDR", "Status Bayar", "Status Kirim", "Tanggal"];
  const csvLines = [headers.join(",")];

  for (const r of rows) {
    const line = [
      escapeCsv(r.id),
      escapeCsv(r.buyerName),
      escapeCsv(r.buyerEmail),
      escapeCsv(r.buyerWhatsapp || ""),
      escapeCsv(r.paymentMethod),
      r.totalIDR,
      escapeCsv(r.paymentStatus || r.status),
      escapeCsv(r.fulfillmentStatus || "pending"),
      escapeCsv(new Date(r.createdAt).toISOString()),
    ];
    csvLines.push(line.join(","));
  }

  const csvContent = csvLines.join("\n");
  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeCsv(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

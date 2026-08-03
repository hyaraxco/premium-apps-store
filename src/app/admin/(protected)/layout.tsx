import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin-nav";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Security gate: unauthenticated requests must never render protected
  // children. Middleware only checks cookie existence; this layout is the
  // real boundary. Login page lives outside this route group.
  if (!(await verifyAdminSession())) {
    redirect("/admin/login");
  }

  let pendingCount = 0;
  if (process.env.DATABASE_URL) {
    try {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(or(eq(schema.orders.paymentStatus, "pending"), eq(schema.orders.status, "pending")));
      pendingCount = Number(rows[0]?.count ?? 0);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-sand/20">
      <AdminNav pendingCount={pendingCount} />
      <main className="min-h-screen md:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}

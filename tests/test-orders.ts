import { db } from "@/db";
import * as schema from "@/db/schema";
async function run() {
  const all = await db.select().from(schema.orders);
  console.log("Total orders:", all.length);
  const pending = all.filter((o) => o.paymentStatus === "pending");
  console.log("Pending orders:", pending.length);
  const cancelled = all.filter((o) => o.paymentStatus === "cancelled");
  console.log("Cancelled orders:", cancelled.length);
}
run().catch(console.error).then(() => process.exit(0));

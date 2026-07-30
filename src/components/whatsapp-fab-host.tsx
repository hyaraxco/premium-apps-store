import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { WhatsappFab } from "@/components/whatsapp-fab";

/** Server wrapper: load admin_wa from settings for storefront FAB. */
export async function WhatsappFabHost() {
  let waNumber: string | undefined;
  if (process.env.DATABASE_URL) {
    try {
      const rows = await db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, "admin_wa"))
        .limit(1);
      const v = rows[0]?.value?.trim();
      if (v) waNumber = v;
    } catch {
      // keep fallback inside client
    }
  }
  return <WhatsappFab waNumber={waNumber} />;
}

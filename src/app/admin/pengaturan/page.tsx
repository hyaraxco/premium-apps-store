import type { Metadata } from "next";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { DEFAULT_MERCHANT_QRIS_STATIC } from "@/lib/qris";
import { updateAdminSettingsAction } from "./actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Pengaturan",
  description: "Pengaturan rekening, QRIS, WA Admin, dan Maintenance mode.",
};

export default async function AdminPengaturanPage() {
  const settingsMap: Record<string, string> = {
    bca_name: "Warung Bu Dir, TJHALANG",
    bca_number: "1234567890",
    seabank_name: "Warung Bu Dir, TJHALANG",
    seabank_number: "9876543210",
    qris_string: DEFAULT_MERCHANT_QRIS_STATIC,
    admin_wa: "6281234567890",
    maintenance_mode: "false",
  };

  if (process.env.DATABASE_URL) {
    try {
      const rows = await db.select().from(schema.adminSettings);
      rows.forEach((r) => {
        settingsMap[r.key] = r.value;
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Pengaturan Toko &amp; Pembayaran
        </h1>
        <p className="text-xs text-ink/60">
          Kelola rekening bank, string QRIS statis, kontak WhatsApp, dan mode maintenance.
        </p>
      </div>

      <form action={updateAdminSettingsAction} className="surface p-6 sm:p-8 space-y-6">
        {/* BCA Section */}
        <div className="space-y-3">
          <h2 className="stamp text-ink/45 font-semibold">Rekening BCA</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink/75">
                Atas Nama
              </label>
              <input
                name="bca_name"
                defaultValue={settingsMap.bca_name}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/75">
                No. Rekening
              </label>
              <input
                name="bca_number"
                defaultValue={settingsMap.bca_number}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
              />
            </div>
          </div>
        </div>

        {/* Seabank Section */}
        <div className="space-y-3 border-t border-line pt-5">
          <h2 className="stamp text-ink/45 font-semibold">Rekening Seabank</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink/75">
                Atas Nama
              </label>
              <input
                name="seabank_name"
                defaultValue={settingsMap.seabank_name}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/75">
                No. Rekening
              </label>
              <input
                name="seabank_number"
                defaultValue={settingsMap.seabank_number}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
              />
            </div>
          </div>
        </div>

        {/* QRIS Statis String Section */}
        <div className="space-y-2 border-t border-line pt-5">
          <h2 className="stamp text-ink/45 font-semibold">
            String QRIS Statis (EMVCo Payload)
          </h2>
          <p className="text-xs text-ink/50">
            Payload string QRIS statis toko Anda. Nominal order akan diinjeksi secara otomatis menjadi QRIS dinamis.
          </p>
          <textarea
            name="qris_string"
            rows={4}
            defaultValue={settingsMap.qris_string}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs font-mono text-ink"
          />
        </div>

        {/* Contact WA Admin Section */}
        <div className="space-y-2 border-t border-line pt-5">
          <h2 className="stamp text-ink/45 font-semibold">
            Nomor WhatsApp Admin (FAB Floating Button)
          </h2>
          <input
            name="admin_wa"
            defaultValue={settingsMap.admin_wa}
            placeholder="6281234567890"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
          />
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center gap-2 border-t border-line pt-5">
          <input
            type="checkbox"
            id="maintenance_mode"
            name="maintenance_mode"
            defaultChecked={settingsMap.maintenance_mode === "true"}
            className="h-4 w-4 rounded accent-ink"
          />
          <label htmlFor="maintenance_mode" className="text-sm font-medium text-ink">
            Aktifkan Mode Maintenance (Nonaktifkan Checkout Publik)
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Simpan Pengaturan
        </Button>
      </form>
    </div>
  );
}

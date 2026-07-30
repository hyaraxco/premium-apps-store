import type { Metadata } from "next";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { DEFAULT_MERCHANT_QRIS_STATIC } from "@/lib/qris";
import { updateAdminSettingsAction } from "./actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { AdminFlash } from "@/components/admin-flash";

export const metadata: Metadata = {
  title: "Admin Pengaturan",
  description: "Pengaturan rekening, QRIS, WA Admin, dan Maintenance mode.",
};

export default async function AdminPengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; msg?: string }>;
}) {
  const sp = await searchParams;

  const settingsMap: Record<string, string> = {
    bca_name: "",
    bca_number: "",
    seabank_name: "",
    seabank_number: "",
    qris_string: DEFAULT_MERCHANT_QRIS_STATIC,
    admin_wa: "",
    maintenance_mode: "false",
  };

  let loadNote: string | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const rows = await db.select().from(schema.adminSettings);
      rows.forEach((r) => {
        settingsMap[r.key] = r.value;
      });
      if (!settingsMap.qris_string) {
        settingsMap.qris_string = DEFAULT_MERCHANT_QRIS_STATIC;
      }
    } catch {
      loadNote = "Gagal muat settings dari DB — menampilkan default QRIS saja.";
    }
  } else {
    loadNote = "DATABASE_URL belum diset — simpan tidak akan persist.";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminFlash searchParams={sp} clearHref="/admin/pengaturan" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Pengaturan Toko &amp; Pembayaran
        </h1>
        <p className="text-xs text-ink/60">
          Rekening, QRIS statis merchant, WA FAB, maintenance.
        </p>
      </div>

      {loadNote && (
        <p className="rounded-lg border border-line bg-sand/40 px-3 py-2 text-xs text-ink/70">
          {loadNote}
        </p>
      )}

      <form
        action={updateAdminSettingsAction}
        className="surface space-y-6 p-6 sm:p-8"
      >
        <div className="space-y-3">
          <h2 className="stamp font-semibold text-ink/45">Rekening BCA</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink/75">
                Atas nama
              </label>
              <input
                name="bca_name"
                defaultValue={settingsMap.bca_name}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/75">
                No. rekening
              </label>
              <input
                name="bca_number"
                defaultValue={settingsMap.bca_number}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-line pt-5">
          <h2 className="stamp font-semibold text-ink/45">Rekening Seabank</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink/75">
                Atas nama
              </label>
              <input
                name="seabank_name"
                defaultValue={settingsMap.seabank_name}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/75">
                No. rekening
              </label>
              <input
                name="seabank_number"
                defaultValue={settingsMap.seabank_number}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-line pt-5">
          <h2 className="stamp font-semibold text-ink/45">
            String QRIS statis (EMVCo)
          </h2>
          <p className="text-xs text-ink/50">
            Payload statis merchant. Divalidasi CRC/TLV saat simpan. Nominal
            order diinjeksi jadi QR dinamis di checkout.
          </p>
          <textarea
            name="qris_string"
            rows={4}
            defaultValue={settingsMap.qris_string}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink"
          />
        </div>

        <div className="space-y-2 border-t border-line pt-5">
          <h2 className="stamp font-semibold text-ink/45">
            WhatsApp admin (tombol bantuan toko)
          </h2>
          <input
            name="admin_wa"
            defaultValue={settingsMap.admin_wa}
            placeholder="6281234567890"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
          />
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-5">
          <input
            type="checkbox"
            id="maintenance_mode"
            name="maintenance_mode"
            defaultChecked={settingsMap.maintenance_mode === "true"}
            className="h-4 w-4 rounded accent-ink"
          />
          <label htmlFor="maintenance_mode" className="text-sm font-medium text-ink">
            Mode maintenance (nonaktifkan checkout publik)
          </label>
        </div>

        <PendingSubmitButton size="lg" className="w-full" pendingLabel="Menyimpan…">
          Simpan pengaturan
        </PendingSubmitButton>
      </form>
    </div>
  );
}

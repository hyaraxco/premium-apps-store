import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { AdminFlash } from "@/components/admin-flash";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { DEFAULT_MERCHANT_QRIS_STATIC } from "@/lib/qris";
import { cn } from "@/lib/utils";
import { updateAdminSettingsAction } from "./actions";

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
      if (!settingsMap.qris_string) settingsMap.qris_string = DEFAULT_MERCHANT_QRIS_STATIC;
    } catch {
      loadNote = "Gagal muat settings dari DB — menampilkan default QRIS saja.";
    }
  } else {
    loadNote = "DATABASE_URL belum diset — simpan tidak akan persist.";
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminFlash searchParams={sp} clearHref="/admin/pengaturan" />

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span>/</span>
        <span className="text-ink/80">Pengaturan</span>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-paper p-5 sm:p-6 border-b border-line">
          <div>
            <p className="stamp text-ink/45">Kontrol toko</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Pengaturan toko & pembayaran
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">
              Rekening, QRIS statis merchant, WA admin, dan maintenance mode.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/order?pay=pending" className="rounded-xl border border-line bg-sand/20 px-3.5 py-2 text-ink hover:bg-sand/60">
              Cek order pending
            </Link>
            <Link href="/admin/produk" className="rounded-xl bg-ink px-3.5 py-2 font-medium text-paper hover:opacity-90">
              Buka produk
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Bank tersimpan" value={String(Boolean(settingsMap.bca_number || settingsMap.seabank_number) ? 2 : 0)} hint="Rekening BCA & Seabank" />
          <Metric label="QRIS siap" value={settingsMap.qris_string ? "Yes" : "No"} hint="Pembayaran QRIS tersedia" tone={settingsMap.qris_string ? "ok" : "warn"} />
          <Metric label="WA admin" value={settingsMap.admin_wa ? "Set" : "Empty"} hint="Tombol bantuan WhatsApp" tone={settingsMap.admin_wa ? "ok" : "warn"} />
          <Metric label="Maintenance" value={settingsMap.maintenance_mode === "true" ? "On" : "Off"} hint="Berlaku ke checkout pelanggan" tone={settingsMap.maintenance_mode === "true" ? "warn" : "ok"} />
        </div>
      </section>

      {loadNote && (
        <div className="rounded-2xl border border-line bg-sand/35 px-4 py-3 text-sm text-ink/70">
          {loadNote}
        </div>
      )}

      <form action={updateAdminSettingsAction} className="space-y-6">
        <section className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Rekening bank</h2>
              <p className="stamp text-ink/45">BCA dan Seabank</p>
            </div>
          </div>

          <div className="mt-5 grid gap-6">
            <SettingGroup title="BCA">
              <SettingField label="Atas nama" name="bca_name" defaultValue={settingsMap.bca_name} mono id="bca_name" />
              <SettingField label="No. rekening" name="bca_number" defaultValue={settingsMap.bca_number} mono id="bca_number" />
            </SettingGroup>

            <SettingGroup title="Seabank" bordered>
              <SettingField label="Atas nama" name="seabank_name" defaultValue={settingsMap.seabank_name} mono id="seabank_name" />
              <SettingField label="No. rekening" name="seabank_number" defaultValue={settingsMap.seabank_number} mono id="seabank_number" />
            </SettingGroup>
          </div>
        </section>

        <section className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">QRIS & kontak</h2>
              <p className="stamp text-ink/45">QRIS statis & tombol WhatsApp</p>
            </div>
          </div>

          <div className="mt-5 grid gap-6">
            <div className="space-y-2">
               <label htmlFor="qris_string" className="block text-xs font-medium text-ink/75">String QRIS statis (EMVCo)</label>
               <textarea
                 id="qris_string"
                 name="qris_string"
                 rows={5}
                 defaultValue={settingsMap.qris_string}
                 className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-mono text-xs text-ink"
               />
               <p className="text-xs text-ink/50">Nominal order tetap diinjeksi di checkout.</p>
             </div>
 
             <div className="space-y-2">
               <label htmlFor="admin_wa" className="block text-xs font-medium text-ink/75">WhatsApp admin</label>
               <input
                 id="admin_wa"
                 name="admin_wa"
                 defaultValue={settingsMap.admin_wa}
                 placeholder="6281234567890"
                 className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
               />
             </div>
          </div>
        </section>

        <section className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Mode sistem</h2>
              <p className="stamp text-ink/45">Pengaruh ke checkout pelanggan</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-sand/20 px-4 py-4">
            <input
              type="checkbox"
              id="maintenance_mode"
              name="maintenance_mode"
              defaultChecked={settingsMap.maintenance_mode === "true"}
              className="h-4 w-4 rounded accent-ink"
            />
            <div>
              <label htmlFor="maintenance_mode" className="text-sm font-medium text-ink">
                Mode maintenance
              </label>
              <p className="text-xs text-ink/55">Nonaktifkan checkout pelanggan saat ada perubahan operasional.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <PendingSubmitButton size="lg" className="w-full sm:w-auto sm:px-8" pendingLabel="Menyimpan…">
            Simpan pengaturan
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="bg-paper p-5 sm:p-6">
      <p className="stamp text-ink/45">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight text-ink", tone === "ok" && "text-emerald-700", tone === "warn" && "text-amber-700")}>{value}</p>
      <p className="mt-2 text-sm text-ink/55">{hint}</p>
    </div>
  );
}

function SettingGroup({
  title,
  bordered,
  children,
}: {
  title: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", bordered && "border-t border-line pt-6")}> 
      <div className="sm:col-span-2">
        <p className="stamp text-ink/45">{title}</p>
      </div>
      {children}
    </div>
  );
}

function SettingField({
   label,
   name,
   defaultValue,
   mono,
   id,
 }: {
   label: string;
   name: string;
   defaultValue: string;
   mono?: boolean;
   id?: string;
 }) {
   const inputId = id ?? name;
   return (
     <div className="space-y-2">
       <label htmlFor={inputId} className="block text-xs font-medium text-ink/75">{label}</label>
       <input
         id={inputId}
         name={name}
         defaultValue={defaultValue}
         className={cn(
           "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink",
           mono && "font-mono",
         )}
       />
     </div>
   );
 }

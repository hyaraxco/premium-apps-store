import Link from "next/link";
import { verifyAdminSession } from "@/lib/admin-auth";
import { logoutAdminAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = await verifyAdminSession();

  if (!isAuthed) {
    return <div className="min-h-screen bg-sand/20">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-sand/20 pb-12">
      {/* Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/order" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-xs font-bold text-paper">
                Hx
              </span>
              <span className="font-semibold text-ink text-sm">Hyarax Apps Admin</span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/admin/order"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand/60"
              >
                Orders
              </Link>
              <Link
                href="/admin/produk"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand/60"
              >
                Produk &amp; Stok
              </Link>
              <Link
                href="/admin/pengaturan"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand/60"
              >
                Pengaturan
              </Link>
            </nav>
          </div>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="text-xs text-ink/60 hover:text-rose-700 font-medium"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">{children}</main>
    </div>
  );
}

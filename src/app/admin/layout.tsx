import { verifyAdminSession } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = await verifyAdminSession();

  // Login page: bare shell, no store chrome (hidden via SiteHeader/Footer path checks)
  if (!isAuthed) {
    return (
      <div className="min-h-[70vh] bg-sand/20">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-sand/20 pb-12">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">{children}</div>
    </div>
  );
}

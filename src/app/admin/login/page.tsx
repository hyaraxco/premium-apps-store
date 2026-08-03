import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Masuk ke panel admin Hyarax Apps.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; flash?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const badPass = sp.error === "1";
  const flashErr = sp.flash === "err" && sp.msg ? sp.msg : null;

  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:py-24">
      <div className="surface p-6 sm:p-8">
        <div className="text-center">
          <span className="stamp text-ink/40">ADMIN PANEL</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Masuk Operator
          </h1>
          <p className="mt-1 text-xs text-ink/60">
            Password admin untuk kelola order, stok, dan pengiriman akses.
          </p>
        </div>

        <AdminLoginForm badPass={badPass} flashErr={flashErr} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { loginAdminAction } from "../actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

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

        {(badPass || flashErr) && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-600/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-950 dark:text-rose-100"
          >
            {flashErr || "Password salah. Coba lagi."}
          </div>
        )}

        <form action={loginAdminAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password Admin
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <PendingSubmitButton size="lg" className="w-full" pendingLabel="Memeriksa…">
            Masuk Admin
          </PendingSubmitButton>
        </form>
      </div>
    </div>
  );
}

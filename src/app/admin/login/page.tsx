import type { Metadata } from "next";
import { loginAdminAction } from "../actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Masuk ke panel admin Stackbay.",
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:py-24">
      <div className="surface p-6 sm:p-8">
        <div className="text-center">
          <span className="stamp text-ink/40">ADMIN PANEL</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Masuk Operator
          </h1>
          <p className="mt-1 text-xs text-ink/60">
            Masukkan password admin untuk mengelola order &amp; produk.
          </p>
        </div>

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
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Masuk Admin
          </Button>
        </form>
      </div>
    </div>
  );
}

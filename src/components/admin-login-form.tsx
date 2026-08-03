"use client";

import { useState } from "react";
import { loginAdminAction } from "@/app/admin/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type Props = {
  badPass: boolean;
  flashErr: string | null;
};

/**
 * Login form (client) so the password field can toggle show/hide.
 * The server action is imported directly — Next.js client components
 * may call server actions via <form action={...}>.
 */
export function AdminLoginForm({ badPass, flashErr }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const visible = showPassword ? "text" : "password";

  return (
    <>
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
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={visible}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 pr-11 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
              aria-controls="password"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/45 transition-colors hover:text-ink focus:outline-none focus-visible:text-ink"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <PendingSubmitButton size="lg" className="w-full" pendingLabel="Memeriksa…">
          Masuk Admin
        </PendingSubmitButton>
      </form>
    </>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.42 8.7 7.22 5.5 12 5.5s8.58 3.2 9.94 6.15a1 1 0 0 1 0 .7C20.58 15.3 16.78 18.5 12 18.5s-8.58-3.2-9.94-6.15Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c4.78 0 8.58 3.2 9.94 6.15a1 1 0 0 1 0 .7 10.3 10.3 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A10.4 10.4 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.42 15.3 7.22 18.5 12 18.5c1.9 0 3.68-.52 5.22-1.39" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="m2.5 2.5 19 19" />
    </svg>
  );
}

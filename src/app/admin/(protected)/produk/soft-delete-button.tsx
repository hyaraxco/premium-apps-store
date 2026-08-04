"use client";

import { useActionState } from "react";
import { softDeleteProductAction } from "./actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { ProductFormState } from "@/lib/product-forms";

export function SoftDeleteProductButton({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    softDeleteProductAction,
    { ok: false },
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="productId" value={productId} />
        <PendingSubmitButton
          variant="ghost"
          size="sm"
          pendingLabel="…"
          className="rounded-xl px-3.5 py-2 text-xs text-rose-600/80 hover:bg-rose-500/10 hover:text-rose-700"
          onClick={(e) => {
            if (
              !window.confirm(
                `Nonaktifkan produk "${name}" dari katalog? Riwayat pesanan tetap tersimpan.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          Hapus (soft)
        </PendingSubmitButton>
      </form>
      {state.message && (
        <p className={`text-[11px] ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}

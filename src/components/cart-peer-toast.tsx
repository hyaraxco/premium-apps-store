"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CART_LOCAL_EVENT,
  isCartPeerMessage,
  openCartChannel,
  type CartPeerMessage,
} from "@/lib/cart-bus";
import { getTabId } from "@/lib/tab-id";

const MAX_TOASTS = 4;
const SELF_MS = 3200;
const PEER_MS = 4200;

type Toast = {
  id: string;
  stamp: string;
  title: string;
  detail: string;
  showCartLink: boolean;
  self: boolean;
};

function messageToToast(msg: CartPeerMessage, self: boolean): Toast {
  const id = `${msg.t}-${msg.action}-${msg.productId ?? "x"}-${self ? "s" : "p"}`;
  const stamp = self ? "Keranjang" : "Tab lain · keranjang";

  if (self) {
    switch (msg.action) {
      case "add":
        return {
          id,
          stamp,
          self,
          title: "Ditambah ke keranjang",
          detail: msg.productName
            ? `${msg.productName}${msg.quantity ? ` · +${msg.quantity}` : ""} · ${msg.count} seat`
            : `${msg.count} seat di keranjang`,
          showCartLink: true,
        };
      case "remove":
        return {
          id,
          stamp,
          self,
          title: "Item dihapus",
          detail: msg.productName
            ? `${msg.productName} · sisa ${msg.count} seat`
            : `Sisa ${msg.count} seat`,
          showCartLink: msg.count > 0,
        };
      case "clear":
        return {
          id,
          stamp,
          self,
          title: "Keranjang dikosongkan",
          detail: "Semua lisensi dihapus",
          showCartLink: false,
        };
      case "set":
        return {
          id,
          stamp,
          self,
          title: "Jumlah diperbarui",
          detail: msg.productName
            ? `${msg.productName} · ${msg.count} seat total`
            : `${msg.count} seat total`,
          showCartLink: true,
        };
      default:
        return {
          id,
          stamp,
          self,
          title: "Keranjang diperbarui",
          detail: `${msg.count} seat`,
          showCartLink: true,
        };
    }
  }

  switch (msg.action) {
    case "add":
      return {
        id,
        stamp,
        self,
        title: "Tab lain menambah keranjang",
        detail: msg.productName
          ? `${msg.productName}${msg.quantity ? ` · +${msg.quantity}` : ""} · ${msg.count} seat`
          : `${msg.count} seat di keranjang`,
        showCartLink: true,
      };
    case "remove":
      return {
        id,
        stamp,
        self,
        title: "Tab lain menghapus item",
        detail: msg.productName
          ? `${msg.productName} · sisa ${msg.count} seat`
          : `Sisa ${msg.count} seat`,
        showCartLink: true,
      };
    case "clear":
      return {
        id,
        stamp,
        self,
        title: "Keranjang dikosongkan di tab lain",
        detail: "Semua lisensi dihapus dari browser ini",
        showCartLink: false,
      };
    case "set":
      return {
        id,
        stamp,
        self,
        title: "Keranjang diubah di tab lain",
        detail: msg.productName
          ? `${msg.productName} · ${msg.count} seat total`
          : `${msg.count} seat total`,
        showCartLink: true,
      };
    default:
      return {
        id,
        stamp,
        self,
        title: "Keranjang sinkron dari tab lain",
        detail: `${msg.count} seat`,
        showCartLink: true,
      };
  }
}

/**
 * Stacked cart toasts:
 * - this tab: CustomEvent stackbay:cart (deferred)
 * - other tabs: BroadcastChannel stackbay-cart
 */
export function CartPeerToast() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Admin panel: no store cart toasts
  const hide = pathname.startsWith("/admin");

  useEffect(() => {
    if (hide) return;
    const tabId = getTabId();
    const bc = openCartChannel();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const dismiss = (id: string) => {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
      setToasts((cur) => cur.filter((x) => x.id !== id));
    };

    const push = (msg: CartPeerMessage, self: boolean) => {
      if (msg.action === "sync") return;
      const next = messageToToast(msg, self);

      setToasts((cur) => {
        // de-dupe identical id; keep newest at bottom (near edge)
        const without = cur.filter((x) => x.id !== next.id);
        return [...without, next].slice(-MAX_TOASTS);
      });

      const prev = timers.get(next.id);
      if (prev) clearTimeout(prev);
      timers.set(
        next.id,
        setTimeout(() => dismiss(next.id), self ? SELF_MS : PEER_MS),
      );
    };

    const onBc = (event: MessageEvent) => {
      if (!isCartPeerMessage(event.data)) return;
      if (event.data.tabId === tabId) return;
      push(event.data, false);
    };

    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<CartPeerMessage>).detail;
      if (!isCartPeerMessage(detail)) return;
      push(detail, true);
    };

    bc?.addEventListener("message", onBc);
    window.addEventListener(CART_LOCAL_EVENT, onLocal);

    return () => {
      bc?.removeEventListener("message", onBc);
      bc?.close();
      window.removeEventListener(CART_LOCAL_EVENT, onLocal);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [hide]);

  if (hide || toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-5"
      role="region"
      aria-label="Notifikasi keranjang"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-line bg-paper px-3.5 py-3 shadow-[var(--shadow-lift)] rounded-[var(--radius-lg)] motion-safe:animate-[sb-toast-in_0.28s_ease-out]"
        >
          <div className="min-w-0 flex-1">
            <p className="stamp text-ink/40">{toast.stamp}</p>
            <p className="mt-0.5 text-sm font-medium leading-snug text-ink">
              {toast.title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
              {toast.detail}
            </p>
            {toast.showCartLink && (
              <Link
                href="/keranjang"
                transitionTypes={["nav-forward"]}
                className="mt-2 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
              >
                Buka keranjang
              </Link>
            )}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-ink/45 hover:bg-sand/50 hover:text-ink"
            aria-label="Tutup notifikasi"
            onClick={() =>
              setToasts((cur) => cur.filter((x) => x.id !== toast.id))
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

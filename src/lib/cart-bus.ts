import type { CartItem } from "@/types/product";

export const CART_STORAGE_KEY = "stackbay-cart-v1";
export const CART_BC_NAME = "stackbay-cart";
/** Same-tab toast bus (BC never delivers to the sender) */
export const CART_LOCAL_EVENT = "stackbay:cart";

export type CartPeerAction =
  | "add"
  | "remove"
  | "set"
  | "clear"
  | "sync";

export type CartPeerMessage = {
  type: "cart";
  tabId: string;
  action: CartPeerAction;
  productId?: string;
  productName?: string;
  quantity?: number;
  count: number;
  items: CartItem[];
  t: number;
  /** true when emitted on the acting tab for local toast */
  self?: boolean;
};

export function parseCart(raw: string | null): CartItem[] | null {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function openCartChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel(CART_BC_NAME);
  } catch {
    return null;
  }
}

export function publishCart(
  bc: BroadcastChannel | null,
  msg: Omit<CartPeerMessage, "type" | "t" | "self">,
) {
  const full: CartPeerMessage = {
    type: "cart",
    t: Date.now(),
    ...msg,
  };

  // Peer tabs
  if (bc) {
    try {
      bc.postMessage(full);
    } catch {
      // ignore
    }
  }

  // Same tab (BC skips sender). Defer so listeners setState after React commit
  // — never fire sync during setState updater / render.
  if (typeof window !== "undefined") {
    const detail = { ...full, self: true } satisfies CartPeerMessage;
    queueMicrotask(() => {
      try {
        window.dispatchEvent(
          new CustomEvent(CART_LOCAL_EVENT, { detail }),
        );
      } catch {
        // ignore
      }
    });
  }
}

export function isCartPeerMessage(data: unknown): data is CartPeerMessage {
  return (
    !!data &&
    typeof data === "object" &&
    (data as CartPeerMessage).type === "cart" &&
    typeof (data as CartPeerMessage).tabId === "string" &&
    Array.isArray((data as CartPeerMessage).items)
  );
}

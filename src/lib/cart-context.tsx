"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProductById } from "@/lib/products";
import type { CartItem } from "@/types/product";
import {
  CART_STORAGE_KEY,
  cartCount,
  openCartChannel,
  parseCart,
  publishCart,
  type CartPeerAction,
} from "@/lib/cart-bus";
import { getTabId } from "@/lib/tab-id";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (productId: string, variantId?: string, quantity?: number, months?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const bcRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef("");
  const skipStorageEcho = useRef(false);

  const broadcast = useCallback(
    (
      action: CartPeerAction,
      next: CartItem[],
      meta?: { productId?: string; quantity?: number },
    ) => {
      const product = meta?.productId
        ? getProductById(meta.productId)
        : undefined;
      publishCart(bcRef.current, {
        tabId: tabIdRef.current,
        action,
        productId: meta?.productId,
        productName: product?.name,
        quantity: meta?.quantity,
        count: cartCount(next),
        items: next,
      });
    },
    [],
  );

  const commit = useCallback(
    (
      action: CartPeerAction,
      compute: (prev: CartItem[]) => CartItem[],
      meta?: { productId?: string; quantity?: number },
    ) => {
      const prev = itemsRef.current;
      const next = compute(prev);
      itemsRef.current = next;
      setItems(next);
      broadcast(action, next, meta);
    },
    [broadcast],
  );

  useEffect(() => {
    tabIdRef.current = getTabId();
    bcRef.current = openCartChannel();

    try {
      const parsed = parseCart(localStorage.getItem(CART_STORAGE_KEY));
      if (parsed) {
        itemsRef.current = parsed;
        setItems(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== CART_STORAGE_KEY || e.storageArea !== localStorage) return;
      if (skipStorageEcho.current) return;
      const parsed = parseCart(e.newValue);
      if (parsed) {
        itemsRef.current = parsed;
        setItems(parsed);
      }
    };

    const onBc = (event: MessageEvent) => {
      const data = event.data;
      if (
        !data ||
        typeof data !== "object" ||
        (data as { type?: string }).type !== "cart"
      ) {
        return;
      }
      if ((data as { tabId?: string }).tabId === tabIdRef.current) return;
      const peerItems = (data as { items?: CartItem[] }).items;
      if (Array.isArray(peerItems)) {
        itemsRef.current = peerItems;
        setItems(peerItems);
      }
    };

    window.addEventListener("storage", onStorage);
    bcRef.current?.addEventListener("message", onBc);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        bcRef.current?.removeEventListener("message", onBc);
        bcRef.current?.close();
      } catch {
        // ignore
      }
      bcRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    skipStorageEcho.current = true;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
    queueMicrotask(() => {
      skipStorageEcho.current = false;
    });
  }, [items, hydrated]);

  const addItem = useCallback(
    (productId: string, variantId?: string, quantity = 1, months = 1) => {
      const targetVariantId = variantId || `${productId}-default`;
      commit(
        "add",
        (prev) => {
          const existing = prev.find(
            (i) => i.productId === productId && i.variantId === targetVariantId
          );
          if (existing) {
            return prev.map((i) =>
              i.productId === productId && i.variantId === targetVariantId
                ? { ...i, quantity: Math.min(i.quantity + quantity, 10), months: months || i.months }
                : i
            );
          }
          return [
            ...prev,
            { productId, variantId: targetVariantId, months, quantity: Math.min(quantity, 10) },
          ];
        },
        { productId, quantity }
      );
    },
    [commit]
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      commit(
        "remove",
        (prev) =>
          prev.filter((i) => {
            if (variantId) return !(i.productId === productId && i.variantId === variantId);
            return i.productId !== productId;
          }),
        { productId }
      );
    },
    [commit]
  );

  const setQuantity = useCallback(
    (productId: string, variantId: string, quantity: number) => {
      commit(
        quantity <= 0 ? "remove" : "set",
        (prev) =>
          quantity <= 0
            ? prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
            : prev.map((i) =>
                i.productId === productId && i.variantId === variantId
                  ? { ...i, quantity: Math.min(quantity, 10) }
                  : i
              ),
        { productId, quantity }
      );
    },
    [commit]
  );

  const clear = useCallback(() => {
    commit("clear", () => []);
  }, [commit]);

  const count = useMemo(() => cartCount(items), [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      const product = getProductById(i.productId);
      if (!product) return sum;
      const basePrice = product.price || product.minPriceIDR || 0;
      // Handle stepper multiplier for monthly family
      const itemMonths = i.months || 1;
      const unitPrice = itemMonths === 12 && product.originalPrice ? product.price || basePrice : basePrice * itemMonths;
      return sum + unitPrice * i.quantity;
    }, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
      hydrated,
    }),
    [items, count, subtotal, addItem, removeItem, setQuantity, clear, hydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

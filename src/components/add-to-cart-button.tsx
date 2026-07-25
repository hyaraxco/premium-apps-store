"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  className,
  size = "md",
  label = "Tambah ke keranjang",
}: {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(productId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      className={cn(className)}
      aria-live="polite"
    >
      {added ? "✓ Ditambahkan" : label}
    </Button>
  );
}

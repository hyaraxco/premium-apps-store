"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  size?: Size;
};

/**
 * Must render inside <form action={serverAction}>.
 * Uses React 19 useFormStatus — Next.js forms guide.
 */
export function PendingSubmitButton({
  children,
  pendingLabel = "Memproses…",
  disabled,
  className,
  variant = "primary",
  size = "md",
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  const busy = pending || !!disabled;

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={busy}
      aria-busy={pending || undefined}
      className={cn(className)}
      {...rest}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

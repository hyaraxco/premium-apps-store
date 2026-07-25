import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warn" | "brand";
}) {
  // All tones use design tokens / one ink system — no orphan Tailwind pastels
  const tones = {
    neutral: "bg-sand text-ink/70 border-line",
    accent: "bg-sand-deep/60 text-ink/80 border-line",
    success: "bg-sand text-ink/70 border-line",
    warn: "bg-sand text-ink/70 border-line",
    brand: "bg-ink text-paper border-ink",
  };

  return (
    <span
      className={cn(
        "stamp inline-flex items-center rounded border px-1.5 py-0.5 font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

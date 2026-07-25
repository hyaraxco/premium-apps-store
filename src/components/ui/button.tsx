import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink/90 active:bg-ink/80 focus-visible:ring-ink/40",
  secondary:
    "bg-sand text-ink hover:bg-sand-deep active:bg-sand-deep/90 focus-visible:ring-ink/20",
  ghost:
    "bg-transparent text-ink hover:bg-sand/80 active:bg-sand focus-visible:ring-ink/15",
  danger:
    "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus-visible:ring-rose-400",
  outline:
    "border border-line bg-paper text-ink hover:bg-sand/50 active:bg-sand/70 focus-visible:ring-ink/20",
};

/* Sharper radii — editorial catalog, not soft pill SaaS */
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg sm:text-[15px]",
  icon: "h-10 w-10 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

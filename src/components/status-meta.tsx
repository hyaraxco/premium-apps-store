import type { ProductStatus } from "@/types/product";
import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/** B+D: ops dot + mono meta row (no SaaS chip). Dot uses status CSS vars. */
export function StatusMeta({
  status,
  meta,
  className,
}: {
  status: ProductStatus;
  meta?: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "stamp flex min-w-0 items-center gap-1.5 text-ink/45",
        className,
      )}
      data-status={status}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          status === "available" && "bg-[var(--status-ok)]",
          status === "limited" && "bg-[var(--status-warn)]",
          status === "preorder" && "bg-[var(--status-hold)]",
        )}
        aria-hidden
      />
      <span className="truncate">
        {statusLabel(status)}
        {meta ? ` · ${meta}` : null}
      </span>
    </p>
  );
}

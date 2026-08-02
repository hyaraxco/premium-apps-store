"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function DebouncedSearch({
  placeholder,
  defaultValue,
  ariaLabel,
}: {
  placeholder: string;
  defaultValue: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        sp.set("q", value.trim());
      } else {
        sp.delete("q");
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <input
      type="search"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full sm:w-auto min-w-[200px] rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-ink/40 focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/30"
    />
  );
}

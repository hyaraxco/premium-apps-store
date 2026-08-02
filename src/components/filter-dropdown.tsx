"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function FilterDropdown({
  name,
  options,
  defaultValue,
  ariaLabel,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const sp = new URLSearchParams(searchParams.toString());
    
    // Hapus pesan flash jika ada
    sp.delete("flash");
    sp.delete("msg");

    if (val && val !== "all") {
      sp.set(name, val);
    } else {
      sp.delete(name);
    }
    
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  return (
    <select
      aria-label={ariaLabel}
      value={defaultValue}
      onChange={handleChange}
      className="h-9 min-w-[140px] appearance-none rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/30 cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat pr-8"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

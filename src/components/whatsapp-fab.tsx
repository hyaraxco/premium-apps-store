"use client";

import { usePathname, useSearchParams } from "next/navigation";

const DEFAULT_WA = "6281234567890";

export function WhatsappFab() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  let orderId = "";
  if (pathname.startsWith("/order/")) {
    orderId = pathname.replace("/order/", "");
  } else if (pathname === "/checkout/sukses") {
    orderId = searchParams.get("order") || "";
  }

  const message = orderId
    ? `Halo Admin Hyarax Apps, saya butuh bantuan / konfirmasi pembayaran untuk pesanan: ${orderId}`
    : "Halo Admin Hyarax Apps, saya ingin bertanya tentang lisensi aplikasi.";

  const waUrl = `https://wa.me/${DEFAULT_WA}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi Admin via WhatsApp"
      className="fixed bottom-5 left-5 z-50 flex h-12 items-center gap-2.5 rounded-full bg-[#25D366] px-4 font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 sm:bottom-6 sm:left-6"
    >
      <svg
        className="h-6 w-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.149 4.197 4.292-1.127z" />
      </svg>
      <span className="text-sm font-medium">Bantuan WA</span>
    </a>
  );
}

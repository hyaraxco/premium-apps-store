import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NavShell } from "@/components/nav-shell";
import { HistoryNav } from "@/components/history-nav";
import { CartPeerToast } from "@/components/cart-peer-toast";
import { WhatsappFabHost } from "@/components/whatsapp-fab-host";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hyarax Apps — Katalog aplikasi premium & subscription",
    template: "%s · Hyarax Apps",
  },
  description:
    "Beli lisensi digital & langganan aplikasi premium: Notion, Figma, ChatGPT, Copilot, Adobe, dan lainnya. Harga IDR, aktivasi cepat.",
};

const themeInit = `(function(){try{var k='stackbay-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <CartProvider>
          <HistoryNav />
          <SiteHeader />
          <main className="flex-1">
            <NavShell>{children}</NavShell>
          </main>
          <SiteFooter />
          <CartPeerToast />
          <Suspense fallback={null}>
            <WhatsappFabHost />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}

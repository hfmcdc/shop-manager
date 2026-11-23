import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "KR TRADERS Billing", manifest: "/manifest.webmanifest", icons: { icon: "/icon-192.png", apple: "/apple-icon.png" }, appleWebApp: { capable: true, title: "KR Billing" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14213d" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <header className="bg-ink px-4 py-3 text-white print:hidden"><nav className="mx-auto flex max-w-5xl items-center gap-5 overflow-x-auto whitespace-nowrap text-sm">
      <b className="mr-auto text-base">KR TRADERS</b>
      <Link href="/">Dashboard</Link><Link href="/billing">Billing</Link><Link href="/bills">Bills</Link><Link href="/products">Products</Link><Link href="/restock">Restock</Link><Link href="/credit">Credit</Link></nav></header>
    <main className="mx-auto max-w-5xl p-4">{children}</main></body></html>);
}

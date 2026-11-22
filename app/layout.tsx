import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "KR TRADERS Billing" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <header className="bg-ink text-white px-4 py-3"><div className="mx-auto max-w-5xl font-semibold">KR TRADERS</div></header>
    <main className="mx-auto max-w-5xl p-4">{children}</main></body></html>);
}

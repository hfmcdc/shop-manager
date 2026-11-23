import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "./Nav";
export const metadata: Metadata = { title: "KR TRADERS Billing", manifest: "/manifest.webmanifest", icons: { icon: "/icon-192.png", apple: "/apple-icon.png" }, appleWebApp: { capable: true, title: "KR Billing" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d1426" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body><Nav /><main className="mx-auto max-w-5xl p-4 pb-24 md:pb-8">{children}</main></body></html>);
}

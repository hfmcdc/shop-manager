"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [["/billing", "🧾", "Billing"], ["/", "📊", "Home"], ["/bills", "🕘", "Bills"], ["/products", "📦", "Products"], ["/restock", "➕", "Restock"], ["/credit", "💳", "Credit"]];
const mobile = [["/", "📊", "Home"], ["/bills", "🕘", "Bills"], ["/billing", "+", "Billing"], ["/products", "📦", "Products"], ["/credit", "💳", "Credit"]];
export default function Nav() {
  const p = usePathname(); const on = (h: string) => (h === "/" ? p === "/" : p.startsWith(h));
  return (<>
    <header className="sticky top-0 z-30 border-b bg-[#0d1426]/90 backdrop-blur print:hidden"><div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
      <b className="mr-auto text-lg tracking-wide">KR <span className="text-teal-400">TRADERS</span></b>
      <nav className="hidden gap-1 md:flex">{items.map(([h, , l]) => <Link key={h} href={h} className={`rounded-lg px-3 py-1.5 text-sm ${on(h) ? "bg-teal-500/20 text-teal-300" : "text-slate-300 hover:bg-white/5"}`}>{l}</Link>)}</nav></div></header>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end border-t bg-[#0d1426]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
      {mobile.map(([h, i, l]) => h === "/billing"
        ? <Link key={h} href={h} className="flex flex-col items-center pb-1"><span className={`-mt-4 flex h-12 w-12 items-center justify-center rounded-full text-3xl font-bold leading-none text-white shadow-lg ring-4 ring-[#0d1426] ${on(h) ? "bg-teal-400" : "bg-teal-600"}`}>{i}</span><span className={`text-[11px] font-semibold ${on(h) ? "text-teal-300" : "text-slate-300"}`}>{l}</span></Link>
        : <Link key={h} href={h} className={`flex flex-col items-center py-2 text-[11px] ${on(h) ? "text-teal-300" : "text-slate-400"}`}><span className="text-lg leading-none">{i}</span>{l}</Link>)}</nav></>);
}

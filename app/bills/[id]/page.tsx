import { db, inr } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
export const dynamic = "force-dynamic";
export default async function Receipt({ params, searchParams }: { params: { id: string }; searchParams: { w?: string } }) {
  const s = db(); const w = searchParams.w === "58" ? 58 : 80;
  const { data: b } = await s.from("bills").select("*, customers(name,phone), bill_items(*)").eq("id", params.id).single();
  if (!b) notFound();
  const { data: shop } = await s.from("shop_settings").select("*").single();
  return (<div className="space-y-3">
    <style>{`@media print{@page{size:${w}mm auto;margin:2mm}}`}</style>
    <div className="flex gap-3 text-sm print:hidden"><PrintButton /><Link href={`?w=${w === 80 ? 58 : 80}`} className="rounded border bg-white px-3 py-2">Switch to {w === 80 ? 58 : 80}mm</Link><Link href="/billing" className="rounded border bg-white px-3 py-2">New bill</Link></div>
    <p className="text-xs text-slate-500 print:hidden">Prints through your browser/OS print dialog to any installed printer. Direct Bluetooth ESC/POS printing is not built in.</p>
    <div style={{ width: `${w}mm` }} className="mx-auto bg-white p-2 font-mono text-[11px] leading-tight print:p-0">
      <div className="text-center"><b className="text-sm">{shop?.name}</b><div>{shop?.address}</div><div>Ph: {shop?.phone}</div></div><hr className="my-1 border-dashed" />
      <div>Bill: {b.bill_no}{b.status === "cancelled" ? " (CANCELLED)" : ""}</div><div>{new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
      {b.customers && <div>Customer: {b.customers.name} {b.customers.phone ?? ""}</div>}<hr className="my-1 border-dashed" />
      {b.bill_items.map((i: any) => (<div key={i.id} className="mb-1"><div>{i.name}</div><div className="flex justify-between"><span>{Number(i.qty)} {i.unit} × {Number(i.unit_price).toFixed(2)}/{""}base</span><span>{Number(i.line_total).toFixed(2)}</span></div></div>))}
      <hr className="my-1 border-dashed" /><div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{inr(b.total)}</span></div>
      <div>Payment: {b.method.toUpperCase()}</div><div>Paid: {inr(b.paid)}</div>{Number(b.total) > Number(b.paid) && <div className="font-bold">Balance due: {inr(Number(b.total) - Number(b.paid))}</div>}
      <hr className="my-1 border-dashed" /><div className="text-center">{shop?.thank_you}</div></div></div>);
}

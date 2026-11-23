import { db, inr } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";
import BillActions from "./BillActions";
export const dynamic = "force-dynamic";
export default async function Receipt({ params, searchParams }: { params: { id: string }; searchParams: { w?: string } }) {
  const s = db(); const w = searchParams.w === "58" ? 58 : 80;
  const { data: b } = await s.from("bills").select("*, customers(name,phone), bill_items(*)").eq("id", params.id).single();
  if (!b) notFound();
  const { data: shop } = await s.from("shop_settings").select("*").single();
  const date = new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const bal = Number(b.total) - Number(b.paid); const cancelled = b.status === "cancelled";
  const text = [`*${shop?.name}*`, shop?.address, `Ph: ${shop?.phone}`, "", `Bill: ${b.bill_no}${cancelled ? " (CANCELLED)" : ""}`, date, "",
    ...b.bill_items.map((i: any) => `${i.name} ${Number(i.qty)} ${i.unit} = ₹${Number(i.line_total).toFixed(2)}`), "",
    `Total: ₹${Number(b.total).toFixed(2)}`, `Payment: ${b.method.toUpperCase()}`, ...(bal > 0.004 && !cancelled ? [`Balance due: ₹${bal.toFixed(2)}`] : []), "", shop?.thank_you].join("\n");
  const ph = (b.customers?.phone ?? "").replace(/\D/g, ""); const to = ph.length === 10 ? "91" + ph : ph.length >= 11 ? ph : "";
  return (<div className="space-y-3">
    <style>{`@media print{@page{size:${w}mm auto;margin:2mm}}`}</style>
    <div className="flex flex-wrap gap-2 text-sm print:hidden"><PrintButton />
      <a href={`https://wa.me/${to}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="rounded bg-green-600 px-3 py-2 font-medium text-white">WhatsApp</a>
      {!cancelled && <BillActions id={b.id} />}
      <Link href={`?w=${w === 80 ? 58 : 80}`} className="rounded border bg-white px-3 py-2">{w === 80 ? "58" : "80"}mm</Link><Link href="/billing" className="rounded border bg-white px-3 py-2">New bill</Link></div>
    <p className="text-xs text-slate-500 print:hidden">WhatsApp sends the receipt as a text message{to ? " to the customer's number" : " (you choose the contact)"}. Printing uses your browser/OS print dialog; direct Bluetooth ESC/POS printing is not built in.</p>
    {cancelled && <p className="rounded bg-red-50 p-2 text-sm text-red-700 print:hidden">Cancelled{b.cancel_reason ? `: ${b.cancel_reason}` : ""}. Stock was restored.</p>}
    <div style={{ width: `${w}mm` }} className="mx-auto bg-white p-2 font-mono text-[11px] leading-tight print:p-0">
      <div className="text-center"><b className="text-sm">{shop?.name}</b><div>{shop?.address}</div><div>Ph: {shop?.phone}</div></div><hr className="my-1 border-dashed" />
      <div>Bill: {b.bill_no}{cancelled ? " (CANCELLED)" : ""}</div><div>{date}</div>
      {b.customers && <div>Customer: {b.customers.name} {b.customers.phone ?? ""}</div>}<hr className="my-1 border-dashed" />
      {b.bill_items.map((i: any) => (<div key={i.id} className="mb-1"><div>{i.name}</div><div className="flex justify-between"><span>{Number(i.qty)} {i.unit}</span><span>{Number(i.line_total).toFixed(2)}</span></div></div>))}
      <hr className="my-1 border-dashed" /><div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{inr(b.total)}</span></div>
      <div>Payment: {b.method.toUpperCase()}</div><div>Paid: {inr(b.paid)}</div>{bal > 0.004 && !cancelled && <div className="font-bold">Balance due: {inr(bal)}</div>}
      <hr className="my-1 border-dashed" /><div className="text-center">{shop?.thank_you}</div></div></div>);
}

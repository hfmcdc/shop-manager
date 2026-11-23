import { db, inr } from "@/lib/db";
import Link from "next/link";
export const dynamic = "force-dynamic";
const ist = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
export default async function Bills({ searchParams }: { searchParams: { q?: string; from?: string; to?: string } }) {
  const s = db(); const from = searchParams.from || ist(); const to = searchParams.to || ist(); const q = (searchParams.q ?? "").trim().replace(/[%,()*]/g, "");
  let query = s.from("bills").select("id,bill_no,total,paid,method,status,created_at,customers(name,phone)").gte("created_at", `${from}T00:00:00+05:30`).lte("created_at", `${to}T23:59:59.999+05:30`).order("created_at", { ascending: false }).limit(200);
  if (q) { const { data: cs } = await s.from("customers").select("id").or(`name.ilike.%${q}%,phone.ilike.%${q}%`); const ids = (cs ?? []).map((c) => c.id);
    query = query.or(ids.length ? `bill_no.ilike.%${q}%,customer_id.in.(${ids.join(",")})` : `bill_no.ilike.%${q}%`); }
  const { data, error } = await query; const rows = (data ?? []) as any[]; const live = rows.filter((r) => r.status === "active");
  const sum = (m: string) => live.filter((r) => r.method === m).reduce((a, r) => a + Number(r.total), 0);
  const inp = "rounded border p-2 text-sm";
  return (<div className="space-y-3">
    <form className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Bill no. or customer" className={inp + " flex-1"} /><input type="date" name="from" defaultValue={from} className={inp} /><input type="date" name="to" defaultValue={to} className={inp} /><button className="rounded bg-brand px-4 text-sm font-medium text-white">Filter</button></form>
    {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error.message}</p>}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{[["Total", sum("cash") + sum("upi") + sum("credit")], ["Cash", sum("cash")], ["UPI", sum("upi")], ["Credit", sum("credit")]].map(([l, v]) => <div key={l as string} className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">{l}</div><div className="font-semibold text-brand">{inr(v as number)}</div></div>)}</div>
    <p className="text-xs text-slate-500">Totals exclude cancelled bills. Showing up to 200 bills.</p>
    <ul className="divide-y rounded-lg border bg-white">{rows.length ? rows.map((r) => (<li key={r.id}><Link href={`/bills/${r.id}`} className="flex justify-between gap-2 p-3 text-sm"><div><div className={r.status === "cancelled" ? "text-slate-400 line-through" : "font-medium"}>{r.bill_no}</div>
      <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {r.method}{r.customers ? ` · ${r.customers.name}` : ""}{r.status === "cancelled" ? " · cancelled" : ""}</div></div><b>{inr(r.total)}</b></Link></li>)) : <li className="p-3 text-sm text-slate-500">No bills for this search and date range.</li>}</ul></div>);
}

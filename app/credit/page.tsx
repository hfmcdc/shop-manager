import { db, inr } from "@/lib/db";
import CollectForm from "./CollectForm";
export const dynamic = "force-dynamic";
const when = (d: string) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
export default async function Credit() {
  const s = db();
  const [b, pay] = await Promise.all([
    s.from("bills").select("id,bill_no,total,paid,created_at,customer_id,customers(name,phone)").eq("status", "active").eq("method", "credit").order("created_at"),
    s.from("payments").select("amount,method,created_at,bills!inner(bill_no,customer_id,method)").eq("bills.method", "credit").order("created_at", { ascending: false }).limit(300)]);
  if (b.error || pay.error) return <p className="rounded bg-red-50 p-3 text-red-700">{(b.error || pay.error)!.message}</p>;
  type G = { id: string; name: string; phone: string | null; due: number; bills: any[] };
  const groups = new Map<string, G>();
  for (const x of b.data as any[]) { const due = Number(x.total) - Number(x.paid); if (due < 0.005) continue;
    const g: G = groups.get(x.customer_id) ?? { id: x.customer_id, name: x.customers?.name, phone: x.customers?.phone, due: 0, bills: [] as any[] };
    g.due = Math.round((g.due + due) * 100) / 100; g.bills.push({ ...x, due }); groups.set(x.customer_id, g); }
  const list = [...groups.values()].sort((a, c) => c.due - a.due); const total = list.reduce((a, g) => a + g.due, 0);
  return (<div className="space-y-3"><div className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">Total outstanding</div><div className="text-xl font-semibold text-brand">{inr(total)}</div></div>
    {list.length ? list.map((g) => (<details key={g.id} className="rounded-lg border bg-white p-3"><summary className="flex cursor-pointer justify-between"><span className="font-medium">{g.name}{g.phone ? ` · ${g.phone}` : ""}</span><b className="text-red-600">{inr(g.due)}</b></summary>
      <div className="mt-3 space-y-3 text-sm"><ul className="divide-y">{g.bills.map((x) => <li key={x.id} className="flex justify-between py-1"><span>{x.bill_no} · {when(x.created_at)}</span><span>{inr(x.due)} of {inr(x.total)}</span></li>)}</ul>
        <CollectForm customerId={g.id} due={g.due} />
        <div><div className="mb-1 font-medium">Payment history</div>
          {(pay.data as any[]).filter((p) => p.bills.customer_id === g.id).slice(0, 10).map((p, i) => <div key={i} className="flex justify-between text-xs text-slate-600"><span>{when(p.created_at)} · {p.bills.bill_no} · {p.method.toUpperCase()}</span><span>{inr(p.amount)}</span></div>)}</div></div></details>))
      : <p className="rounded-lg border bg-white p-3 text-sm text-slate-500">No pending credit. Credit bills appear here.</p>}</div>);
}

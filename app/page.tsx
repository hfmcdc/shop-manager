import { db, inr } from "@/lib/db";
export const dynamic = "force-dynamic";
const istDayStart = () => { const n = new Date(Date.now() + 5.5 * 3600e3); n.setUTCHours(0, 0, 0, 0); return new Date(n.getTime() - 5.5 * 3600e3).toISOString(); };
export default async function Dashboard() {
  const s = db();
  const [today, out, recent, open] = await Promise.all([
    s.from("bills").select("total").eq("status", "active").gte("created_at", istDayStart()),
    s.from("products").select("id,name,unit").eq("is_active", true).lte("stock", 0).order("name").limit(50),
    s.from("bills").select("id,bill_no,total,paid,method,status,created_at").order("created_at", { ascending: false }).limit(10),
    s.from("bills").select("total,paid").eq("status", "active").eq("method", "credit"),
  ]);
  const err = today.error || out.error || recent.error || open.error;
  if (err) return <p className="rounded bg-red-50 p-3 text-red-700">Could not load data: {err.message}</p>;
  const sales = (today.data ?? []).reduce((a, b) => a + Number(b.total), 0);
  const pending = (open.data ?? []).filter((b) => Number(b.total) > Number(b.paid));
  const outstanding = pending.reduce((a, b) => a + Number(b.total) - Number(b.paid), 0);
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Today's sales" value={inr(sales)} />
      <Stat label="Outstanding credit" value={inr(outstanding)} />
      <Stat label="Pending bills" value={String(pending.length)} />
      <Stat label="Out of stock" value={String(out.data?.length ?? 0)} />
    </div>
    <section className="rounded-lg border bg-white p-3"><h2 className="mb-2 font-semibold">Recent bills</h2>
      {recent.data?.length ? <ul className="divide-y">{recent.data.map((b) => (
        <li key={b.id} className="flex justify-between py-2 text-sm"><span>{b.bill_no} · {b.method}{b.status === "cancelled" ? " · cancelled" : ""}</span><span className="font-medium">{inr(b.total)}</span></li>))}</ul>
        : <p className="text-sm text-slate-500">No bills yet. Bills appear here after the first sale.</p>}</section>
    <section className="rounded-lg border bg-white p-3"><h2 className="mb-2 font-semibold">Out-of-stock products</h2>
      {out.data?.length ? <ul className="text-sm">{out.data.map((p) => <li key={p.id} className="py-1">{p.name}</li>)}</ul>
        : <p className="text-sm text-slate-500">Nothing is out of stock.</p>}</section>
  </div>);
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="pop rounded-2xl border bg-white p-4"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-3xl font-extrabold text-emerald-400">{value}</div></div>;
}

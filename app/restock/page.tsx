import { db } from "@/lib/db";
import RestockForm from "./RestockForm";
export const dynamic = "force-dynamic";
const label: Record<string, string> = { sale: "Sale", restock: "Restock", adjust: "Adjust", cancel: "Cancelled bill", edit: "Bill edit" };
export default async function Restock() {
  const { data, error } = await db().from("stock_movements").select("id,delta,reason,note,created_at,products(name,unit)").order("created_at", { ascending: false }).limit(40);
  return (<div className="space-y-4"><RestockForm />
    <section className="rounded-lg border bg-white p-3"><h2 className="mb-2 font-semibold">Stock history</h2>
      {error && <p className="text-sm text-red-700">{error.message}</p>}
      {data?.length ? <ul className="divide-y text-sm">{(data as any[]).map((m) => (<li key={m.id} className="flex justify-between gap-2 py-2"><div><div>{m.products?.name}</div>
        <div className="text-xs text-slate-500">{label[m.reason]} · {new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{m.note ? ` · ${m.note}` : ""}</div></div>
        <b className={Number(m.delta) < 0 ? "text-red-600" : "text-green-700"}>{Number(m.delta) > 0 ? "+" : ""}{Number(m.delta)} {m.products?.unit}</b></li>))}</ul>
        : <p className="text-sm text-slate-500">No stock movements yet.</p>}</section></div>);
}

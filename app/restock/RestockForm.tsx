"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductPicker, { PP } from "../ProductPicker";
import { restockAction } from "../actions";
import { GROUP } from "@/lib/units";
export default function RestockForm() {
  const r = useRouter(); const [p, setP] = useState<PP | null>(null); const [qty, setQty] = useState(""); const [unit, setUnit] = useState("pcs"); const [note, setNote] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [key, setKey] = useState(() => crypto.randomUUID());
  async function save() { setErr(""); setMsg(""); if (!p) return setErr("Choose a product first."); setBusy(true);
    const res = await restockAction({ key, product_id: p.id, qty: Number(qty), unit, note }); setBusy(false);
    if (res.error) return setErr(res.error);
    setMsg(`Added to ${p.name}. New stock: ${res.stock} ${p.unit}`); setP(null); setQty(""); setNote(""); setKey(crypto.randomUUID()); r.refresh(); }
  const inp = "rounded border p-2 text-sm";
  return (<div className="space-y-2 rounded-lg border bg-white p-3">
    <ProductPicker onPick={(x) => { setP(x); setUnit(x.unit); setMsg(""); }} />
    {p && <div className="space-y-2"><div className="text-sm"><b>{p.name}</b> · current stock {p.stock} {p.unit}</div>
      <div className="flex gap-2"><input value={qty} inputMode="decimal" onChange={(e) => setQty(e.target.value)} placeholder="Quantity received" className={inp + " flex-1"} />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inp}>{GROUP[p.unit].map((u) => <option key={u}>{u}</option>)}</select></div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (supplier, invoice no.) optional" className={inp + " w-full"} />
      <button disabled={busy} onClick={save} className="w-full rounded bg-brand p-2 font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Add stock"}</button></div>}
    {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}{msg && <p className="rounded bg-green-50 p-2 text-sm text-green-800">{msg}</p>}</div>);
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collectPaymentAction } from "../actions";
export default function CollectForm({ customerId, due }: { customerId: string; due: number }) {
  const r = useRouter(); const [amt, setAmt] = useState(due.toFixed(2)); const [m, setM] = useState<"cash" | "upi">("cash"); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [key, setKey] = useState(() => crypto.randomUUID());
  async function go() { setErr(""); setBusy(true); const res = await collectPaymentAction({ key, customer_id: customerId, amount: Number(amt), method: m }); setBusy(false); if (res.error) return setErr(res.error); setKey(crypto.randomUUID()); r.refresh(); }
  return (<div className="space-y-2"><div className="flex gap-2"><input value={amt} inputMode="decimal" onChange={(e) => setAmt(e.target.value)} className="w-28 rounded border p-2 text-sm" />
    {(["cash", "upi"] as const).map((x) => <button key={x} onClick={() => setM(x)} className={`rounded border px-3 text-sm ${m === x ? "bg-brand text-white" : "bg-white"}`}>{x === "upi" ? "UPI" : "Cash"}</button>)}
    <button disabled={busy} onClick={go} className="flex-1 rounded bg-brand p-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Collect"}</button></div>
    {err && <p className="text-sm text-red-700">{err}</p>}</div>);
}

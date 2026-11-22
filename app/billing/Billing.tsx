"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBillAction } from "../actions";
import { F, GROUP } from "@/lib/units";
type P = { id: string; name: string; barcode: string | null; price: number; unit: string; stock: number };
type L = { p: P; qty: string; unit: string };
const lineTotal = (l: L) => Math.round((Number(l.qty) || 0) * (F[l.unit] / F[l.p.unit]) * l.p.price * 100) / 100;
export default function Billing({ products }: { products: P[] }) {
  const r = useRouter(); const [q, setQ] = useState(""); const [lines, setLines] = useState<L[]>([]);
  const [method, setMethod] = useState<"cash" | "upi" | "credit">("cash"); const [paid, setPaid] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID()); const [cam, setCam] = useState(false); const vid = useRef<HTMLVideoElement>(null);
  const add = (p: P) => { setLines((ls) => ls.find((l) => l.p.id === p.id) ? ls.map((l) => l.p.id === p.id ? { ...l, qty: String(Number(l.qty) + 1) } : l) : [...ls, { p, qty: "1", unit: p.unit }]); setQ(""); };
  const byCode = (c: string) => { const p = products.find((x) => x.barcode === c.trim()); if (p) { add(p); return true; } return false; };
  const total = Math.round(lines.reduce((a, l) => a + lineTotal(l) * 100, 0)) / 100;
  const found = q ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.barcode === q).slice(0, 8) : [];
  useEffect(() => { if (!cam) return; let stop = false; let st: MediaStream;
    const BD = (window as any).BarcodeDetector; const det = new BD();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (s) => { st = s; if (vid.current) { vid.current.srcObject = s; await vid.current.play(); }
      const tick = async () => { if (stop || !vid.current) return; try { const c = await det.detect(vid.current); if (c[0] && byCode(c[0].rawValue)) { setCam(false); return; } } catch {} setTimeout(tick, 300); }; tick(); })
      .catch(() => { setMsg("Camera permission denied."); setCam(false); });
    return () => { stop = true; st?.getTracks().forEach((t) => t.stop()); }; }, [cam]); // eslint-disable-line
  async function submit() {
    setMsg(""); if (!lines.length) return setMsg("Add at least one product.");
    setBusy(true);
    const res = await createBillAction({ key, method, paid: Number(paid) || 0, name, phone, items: lines.map((l) => ({ product_id: l.p.id, qty: Number(l.qty), unit: l.unit })) });
    setBusy(false); if (res.error) return setMsg(res.error); setKey(crypto.randomUUID()); r.push(`/bills/${res.id}`);
  }
  const inp = "rounded border p-2 text-sm";
  return (<div className="space-y-3">
    <div className="flex gap-2"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && byCode(q)) e.preventDefault(); }} placeholder="Search product or scan barcode" className={inp + " flex-1"} />
      <button onClick={() => "BarcodeDetector" in window ? setCam(true) : setMsg("Camera scanning isn't supported in this browser. Use a Bluetooth/USB scanner or type the barcode.")} className="rounded border bg-white px-3 text-sm">Scan</button></div>
    {cam && <div><video ref={vid} className="w-full max-w-sm rounded" muted playsInline /><button onClick={() => setCam(false)} className="text-sm text-red-600">Close camera</button></div>}
    {found.length > 0 && <ul className="divide-y rounded border bg-white">{found.map((p) => <li key={p.id}><button onClick={() => add(p)} className="flex w-full justify-between p-2 text-left text-sm"><span>{p.name}</span><span className="text-slate-500">{p.stock} {p.unit} in stock</span></button></li>)}</ul>}
    <ul className="divide-y rounded-lg border bg-white">{lines.length ? lines.map((l) => (<li key={l.p.id} className="flex flex-wrap items-center gap-2 p-2 text-sm">
      <span className="mr-auto min-w-[8rem]">{l.p.name}</span>
      <input value={l.qty} inputMode="decimal" onChange={(e) => setLines(lines.map((x) => x.p.id === l.p.id ? { ...x, qty: e.target.value } : x))} className={inp + " w-20"} />
      <select value={l.unit} onChange={(e) => setLines(lines.map((x) => x.p.id === l.p.id ? { ...x, unit: e.target.value } : x))} className={inp}>{GROUP[l.p.unit].map((u) => <option key={u}>{u}</option>)}</select>
      <span className="w-24 text-right font-medium">₹{lineTotal(l).toFixed(2)}</span>
      <button onClick={() => setLines(lines.filter((x) => x.p.id !== l.p.id))} className="text-red-600">Remove</button></li>))
      : <li className="p-3 text-sm text-slate-500">Search or scan a product to start the bill.</li>}</ul>
    <div className="flex gap-2">{(["cash", "upi", "credit"] as const).map((m) => <button key={m} onClick={() => setMethod(m)} className={`flex-1 rounded border p-2 text-sm font-medium ${method === m ? "bg-brand text-white" : "bg-white"}`}>{m === "upi" ? "UPI" : m[0].toUpperCase() + m.slice(1)}</button>)}</div>
    <div className="grid gap-2 sm:grid-cols-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={method === "credit" ? "Customer name (required)" : "Customer name (optional)"} className={inp} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Customer phone" className={inp} />
      {method === "credit" && <input value={paid} inputMode="decimal" onChange={(e) => setPaid(e.target.value)} placeholder="Paid now ₹ (optional)" className={inp} />}</div>
    {msg && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{msg}</p>}
    <button disabled={busy} onClick={submit} className="w-full rounded bg-brand p-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : `Complete bill · ₹${total.toFixed(2)}`}</button></div>);
}

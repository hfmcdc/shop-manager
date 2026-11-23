"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBillAction, findProductByBarcode, searchProducts } from "../actions";
import { F, GROUP } from "@/lib/units";
type P = { id: string; name: string; barcode: string | null; price: number; unit: string; stock: number };
type L = { p: P; qty: string; unit: string };
const lineTotal = (l: L) => Math.round((Number(l.qty) || 0) * (F[l.unit] / F[l.p.unit]) * l.p.price * 100) / 100;
type Edit = { id: string; no: string; method: "cash" | "upi" | "credit"; paid: string; name: string; phone: string; lines: L[] };
export default function Billing({ products, edit }: { products: P[]; edit?: Edit }) {
  const r = useRouter(); const [q, setQ] = useState(""); const [lines, setLines] = useState<L[]>(edit?.lines ?? []);
  const [method, setMethod] = useState<"cash" | "upi" | "credit">(edit?.method ?? "cash"); const [paid, setPaid] = useState(edit?.paid ?? "");
  const [name, setName] = useState(edit?.name ?? ""); const [phone, setPhone] = useState(edit?.phone ?? ""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID()); const [cam, setCam] = useState(false); const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => { r.refresh(); }, []); // always load the latest products & stock
  const add = (p: P) => { setLines((ls) => ls.find((l) => l.p.id === p.id) ? ls.map((l) => l.p.id === p.id ? { ...l, qty: String(Number(l.qty) + 1) } : l) : [...ls, { p, qty: "1", unit: p.unit }]); setQ(""); };
  const norm = (c: string) => c.trim().replace(/^0+/, "");
  const byCode = async (c: string) => { let p: P | undefined = products.find((x) => x.barcode && norm(x.barcode) === norm(c)); if (!p) p = (await findProductByBarcode(c)) ?? undefined; if (p) { add(p); setMsg(""); return true; } return false; };
  const total = Math.round(lines.reduce((a, l) => a + lineTotal(l) * 100, 0)) / 100;
  const [found, setFound] = useState<P[]>([]);
  useEffect(() => { const s = q.trim(); if (!s) { setFound([]); return; } let off = false;
    const h = setTimeout(async () => { const res = await searchProducts(s); if (off) return; setFound(res.items as P[]); if (res.error) setMsg("Search failed: " + res.error); }, 200);
    return () => { off = true; clearTimeout(h); }; }, [q]);
  useEffect(() => { if (!cam) return; let stop = false; let st: MediaStream;
    const BD = (window as any).BarcodeDetector; const det = new BD();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (s) => { st = s; if (vid.current) { vid.current.srcObject = s; await vid.current.play(); }
      const tick = async () => { if (stop || !vid.current) return; try { const c = await det.detect(vid.current); if (c[0]) { if (await byCode(c[0].rawValue)) { setCam(false); return; } setMsg(`Scanned ${c[0].rawValue} but no product has this barcode (${products.length} products loaded). Add it in Products first.`); setTimeout(tick, 1500); return; } } catch {} setTimeout(tick, 300); }; tick(); })
      .catch(() => { setMsg("Camera permission denied."); setCam(false); });
    return () => { stop = true; st?.getTracks().forEach((t) => t.stop()); }; }, [cam]); // eslint-disable-line
  async function submit() {
    setMsg(""); if (!lines.length) return setMsg("Add at least one product.");
    setBusy(true);
    const res = await createBillAction({ edit_id: edit?.id, key, method, paid: Number(paid) || 0, name, phone, items: lines.map((l) => ({ product_id: l.p.id, qty: Number(l.qty), unit: l.unit })) });
    setBusy(false); if (res.error) return setMsg(res.error); setKey(crypto.randomUUID()); r.push(`/bills/${res.id}`);
  }
  const inp = "rounded-xl border p-3 text-base";
  const setQty = (id: string, v: string) => setLines((ls) => ls.map((x) => (x.p.id === id ? { ...x, qty: v } : x)));
  const bump = (id: string, d: number) => setLines((ls) => ls.flatMap((x) => { if (x.p.id !== id) return [x]; const n = Math.round((Number(x.qty) + d) * 1000) / 1000; return n > 0 ? [{ ...x, qty: String(n) }] : []; }));
  const count = lines.length; const pm = { cash: "bg-emerald-600", upi: "bg-violet-600", credit: "bg-amber-600" };
  return (<div className="space-y-4 pb-32">
    {edit && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Editing bill {edit.no}. Saving cancels it, restores its stock and creates a corrected bill.</p>}
    <div className="space-y-2 rounded-2xl border bg-white p-3">
      <div className="flex gap-2"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void byCode(q); } }} placeholder="🔍 Search product or scan barcode" className={inp + " min-w-0 flex-1"} />
        <button onClick={() => "BarcodeDetector" in window ? (setMsg(""), setCam(true)) : setMsg("Camera scanning isn't supported in this browser. Use Chrome on Android, or a Bluetooth/USB scanner.")} className="rounded-xl bg-teal-600 px-5 font-semibold text-white">Scan</button></div>
      {cam && <div className="space-y-1"><video ref={vid} className="w-full max-w-sm rounded-xl" muted playsInline /><p className="text-xs text-slate-500">Scanning… hold the barcode steady, 15–20 cm away, in good light.</p>{msg && <p className="rounded-xl bg-red-50 p-2 text-sm text-red-700">{msg}</p>}<button onClick={() => setCam(false)} className="text-sm text-red-400">Close camera</button></div>}
      {found.length > 0 && <ul className="space-y-1">{found.map((p) => <li key={p.id} className="pop"><button onClick={() => add(p)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-[var(--surface2)] p-3 text-left"><span className="font-medium">{p.name}</span><span className="text-right text-sm"><b className="text-emerald-400">₹{p.price}</b> / {p.unit}<br /><span className="text-xs text-slate-500">{p.stock} {p.unit} in stock</span></span></button></li>)}</ul>}
      {q.trim() && found.length === 0 && <p className="text-sm text-slate-500">No product found for this search.</p>}</div>
    <div className="space-y-2">{count ? lines.map((l) => (<div key={l.p.id} className="pop rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{l.p.name}</div><div className="text-xs text-slate-500">₹{l.p.price} per {l.p.unit}</div></div>
        <button onClick={() => setLines(lines.filter((x) => x.p.id !== l.p.id))} aria-label="Remove" className="rounded-lg px-2 text-2xl leading-none text-red-400">×</button></div>
      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => bump(l.p.id, -1)} className="h-11 w-11 rounded-xl bg-[var(--surface2)] text-2xl">−</button>
        <input value={l.qty} inputMode="decimal" onChange={(e) => setQty(l.p.id, e.target.value)} className="h-11 w-20 rounded-xl border text-center text-lg font-semibold" />
        <button onClick={() => bump(l.p.id, 1)} className="h-11 w-11 rounded-xl bg-teal-600 text-2xl text-white">+</button>
        <select value={l.unit} onChange={(e) => setLines(lines.map((x) => x.p.id === l.p.id ? { ...x, unit: e.target.value } : x))} className="h-11 rounded-xl border px-2">{GROUP[l.p.unit].map((u) => <option key={u}>{u}</option>)}</select>
        <span className="ml-auto text-xl font-bold text-emerald-400">₹{lineTotal(l).toFixed(2)}</span></div></div>))
      : <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500"><div className="text-4xl">🛒</div>Search or scan a product to start the bill</div>}</div>
    <div className="space-y-3 rounded-2xl border bg-white p-3"><div className="grid grid-cols-3 gap-2">{(["cash", "upi", "credit"] as const).map((m) => <button key={m} onClick={() => setMethod(m)} className={`rounded-xl p-3 font-semibold ${method === m ? pm[m] + " text-white shadow-lg" : "bg-[var(--surface2)] text-slate-400"}`}>{m === "upi" ? "UPI" : m[0].toUpperCase() + m.slice(1)}</button>)}</div>
      <div className="grid gap-2 sm:grid-cols-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={method === "credit" ? "Customer name (required)" : "Customer name (optional)"} className={inp} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Customer phone" className={inp} />
        {method === "credit" && <input value={paid} inputMode="decimal" onChange={(e) => setPaid(e.target.value)} placeholder="Paid now ₹ (optional)" className={inp} />}</div></div>
    {msg && !cam && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
    <div className="fixed inset-x-0 bottom-14 z-20 border-t bg-[#0d1426]/95 p-3 backdrop-blur md:bottom-0"><div className="mx-auto flex max-w-5xl items-center gap-3">
      <div className="mr-auto"><div className="text-xs uppercase tracking-wide text-slate-500">{count} item{count === 1 ? "" : "s"} · Total</div><span key={total} className="bump text-3xl font-extrabold text-emerald-400">₹{total.toFixed(2)}</span></div>
      <button disabled={busy || !count} onClick={submit} className="rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-40">{busy ? "Saving…" : "Complete bill"}</button></div></div>
  </div>);
}

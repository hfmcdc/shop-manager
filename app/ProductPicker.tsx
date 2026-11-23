"use client";
import { useEffect, useRef, useState } from "react";
import { findProductByBarcode, searchProducts } from "./actions";
export type PP = { id: string; name: string; barcode: string | null; unit: string; stock: number };
export default function ProductPicker({ onPick }: { onPick: (p: PP) => void }) {
  const [q, setQ] = useState(""); const [items, setItems] = useState<PP[]>([]); const [cam, setCam] = useState(false); const [msg, setMsg] = useState(""); const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => { const s = q.trim(); if (!s) { setItems([]); return; } let off = false;
    const h = setTimeout(async () => { const r = await searchProducts(s); if (!off) { setItems(r.items as PP[]); if (r.error) setMsg(r.error); } }, 200);
    return () => { off = true; clearTimeout(h); }; }, [q]);
  const pick = (p: PP) => { onPick(p); setQ(""); setItems([]); setMsg(""); };
  useEffect(() => { if (!cam) return; let stop = false; let st: MediaStream | undefined; const det = new (window as any).BarcodeDetector();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (s) => {
      if (stop) { s.getTracks().forEach((t) => t.stop()); return; } st = s; if (vid.current) { vid.current.srcObject = s; await vid.current.play(); }
      const tick = async () => { if (stop || !vid.current) return; try { const c = await det.detect(vid.current); if (c[0]) { const p = await findProductByBarcode(c[0].rawValue); if (p) { setCam(false); pick(p as PP); return; } setMsg(`Scanned ${c[0].rawValue}: no product has this barcode. Register it in Products first.`); setTimeout(tick, 1500); return; } } catch {} setTimeout(tick, 300); };
      tick(); }).catch(() => { setMsg("Camera permission denied."); setCam(false); });
    return () => { stop = true; st?.getTracks().forEach((t) => t.stop()); }; }, [cam]); // eslint-disable-line
  const go = async () => { const p = await findProductByBarcode(q.trim()); if (p) pick(p as PP); };
  return (<div className="space-y-2"><div className="flex gap-2">
    <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void go(); } }} placeholder="Search product or scan barcode" className="flex-1 rounded border p-2 text-sm" />
    <button type="button" onClick={() => cam ? setCam(false) : "BarcodeDetector" in window ? (setMsg(""), setCam(true)) : setMsg("Camera scanning isn't supported in this browser. Use Chrome on Android, or a barcode scanner.")} className="rounded border bg-white px-3 text-sm">{cam ? "Stop" : "Scan"}</button></div>
    {cam && <video ref={vid} className="w-full max-w-sm rounded" muted playsInline />}
    {items.length > 0 && <ul className="divide-y rounded border bg-white">{items.map((p) => <li key={p.id}><button type="button" onClick={() => pick(p)} className="flex w-full justify-between p-2 text-left text-sm"><span>{p.name}</span><span className="text-slate-500">{p.stock} {p.unit}</span></button></li>)}</ul>}
    {q.trim() && items.length === 0 && <p className="text-xs text-slate-500">No product found.</p>}
    {msg && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{msg}</p>}</div>);
}

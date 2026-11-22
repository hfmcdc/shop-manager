"use client";
import { useEffect, useRef, useState } from "react";
export default function BarcodeInput({ defaultValue, className }: { defaultValue?: string; className?: string }) {
  const [v, setV] = useState(defaultValue ?? ""); const [cam, setCam] = useState(false); const [msg, setMsg] = useState(""); const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!cam) return; let stop = false; let st: MediaStream | undefined;
    const det = new (window as any).BarcodeDetector();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (s) => {
      if (stop) { s.getTracks().forEach((t) => t.stop()); return; }
      st = s; if (vid.current) { vid.current.srcObject = s; await vid.current.play(); }
      const tick = async () => { if (stop || !vid.current) return; try { const c = await det.detect(vid.current); if (c[0]) { setV(c[0].rawValue); setCam(false); return; } } catch {} setTimeout(tick, 300); };
      tick();
    }).catch(() => { setMsg("Camera permission denied."); setCam(false); });
    return () => { stop = true; st?.getTracks().forEach((t) => t.stop()); };
  }, [cam]);
  function start() { setMsg(""); if (!("BarcodeDetector" in window)) return setMsg("Camera scanning isn't supported in this browser. Use Chrome on an Android phone, or a barcode scanner."); setCam(true); }
  return (<div className="flex flex-col gap-1">
    <div className="flex gap-1"><input name="barcode" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} placeholder="Barcode (scan or type)" className={className} />
      <button type="button" onClick={() => (cam ? setCam(false) : start())} className="rounded border bg-white px-3 text-sm">{cam ? "Stop" : "Scan"}</button></div>
    {cam && <video ref={vid} className="w-full rounded" muted playsInline />}
    {msg && <p className="text-xs text-red-600">{msg}</p>}</div>);
}

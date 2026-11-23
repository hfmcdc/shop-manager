"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBillAction } from "../../actions";
export default function BillActions({ id }: { id: string }) {
  const r = useRouter(); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function cancel() {
    const reason = window.prompt("Reason for cancelling this bill? Its stock will be restored."); if (reason === null) return;
    if (!window.confirm("Cancel this bill? This cannot be undone. It stays in history marked as cancelled.")) return;
    setBusy(true); const res = await cancelBillAction({ id, reason }); setBusy(false); if (res.error) setErr(res.error); else r.refresh();
  }
  return (<>
    <a href={`/billing?edit=${id}`} className="rounded border bg-white px-3 py-2">Edit</a>
    <button disabled={busy} onClick={cancel} className="rounded border border-red-300 bg-white px-3 py-2 text-red-600 disabled:opacity-50">{busy ? "Cancelling…" : "Cancel bill"}</button>
    {err && <span className="w-full text-red-700">{err}</span>}</>);
}

import { db, inr } from "@/lib/db";
import { BASE_UNITS } from "@/lib/units";
import { saveProduct, deleteProduct } from "../actions";
export const dynamic = "force-dynamic";
export default async function Products({ searchParams }: { searchParams: { edit?: string; error?: string; q?: string } }) {
  const s = db(); let q = s.from("products").select("*").eq("is_active", true).order("name");
  if (searchParams.q) q = q.ilike("name", `%${searchParams.q.replace(/[%,]/g, "")}%`);
  const { data, error } = await q; const edit = data?.find((p) => p.id === searchParams.edit);
  const inp = "w-full rounded border p-2 text-sm";
  return (<div className="space-y-4">
    {(searchParams.error || error) && <p className="rounded bg-red-50 p-3 text-red-700">{searchParams.error || error?.message}</p>}
    <form action={saveProduct} key={edit?.id ?? "new"} className="grid gap-2 rounded-lg border bg-white p-3 sm:grid-cols-6">
      <input type="hidden" name="id" defaultValue={edit?.id} />
      <input name="name" required placeholder="Product name" defaultValue={edit?.name} className={inp + " sm:col-span-2"} />
      <input name="barcode" placeholder="Barcode (optional)" defaultValue={edit?.barcode ?? ""} className={inp} />
      <input name="price" required type="number" step="0.01" min="0" placeholder="Price per unit ₹" defaultValue={edit?.price} className={inp} />
      <select name="unit" defaultValue={edit?.unit ?? "pcs"} className={inp}>{BASE_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
      {!edit && <input name="stock" type="number" step="0.001" min="0" placeholder="Opening stock" className={inp} />}
      <button className="rounded bg-brand p-2 text-sm font-medium text-white sm:col-span-2">{edit ? "Save changes" : "Add product"}</button>
    </form>
    <form className="flex gap-2"><input name="q" placeholder="Search products" defaultValue={searchParams.q} className={inp} /><button className="rounded border bg-white px-4 text-sm">Search</button></form>
    <ul className="divide-y rounded-lg border bg-white">{data?.length ? data.map((p) => (
      <li key={p.id} className="flex items-center gap-3 p-3 text-sm"><div className="mr-auto"><div className="font-medium">{p.name}</div>
        <div className="text-slate-500">{inr(p.price)} / {p.unit} · Stock {Number(p.stock)} {p.unit}{p.barcode ? ` · ${p.barcode}` : ""}</div></div>
        <a href={`/products?edit=${p.id}`} className="text-brand">Edit</a>
        <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="text-red-600">Delete</button></form></li>))
      : <li className="p-3 text-sm text-slate-500">No products yet. Add your first product above.</li>}</ul></div>);
}

import { db } from "@/lib/db";
import Billing from "./Billing";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: { edit?: string } }) {
  const s = db();
  const { data } = await s.from("products").select("id,name,barcode,price,unit,stock").eq("is_active", true).order("name");
  let edit: any;
  if (searchParams.edit) {
    const { data: b } = await s.from("bills").select("id,bill_no,method,paid,status,customers(name,phone),bill_items(product_id,qty,unit)").eq("id", searchParams.edit).single();
    if (b && b.status === "active") {
      const items = b.bill_items as any[];
      const { data: ps } = await s.from("products").select("id,name,barcode,price,unit,stock").in("id", items.map((i) => i.product_id));
      const lines = items.map((i) => { const p = ps?.find((x) => x.id === i.product_id); return p ? { p: { ...p, price: Number(p.price), stock: Number(p.stock) }, qty: String(Number(i.qty)), unit: i.unit } : null; }).filter(Boolean);
      const c = (b as any).customers;
      edit = { id: b.id, no: b.bill_no, method: b.method, paid: b.method === "credit" && Number(b.paid) > 0 ? String(Number(b.paid)) : "", name: c?.name ?? "", phone: c?.phone ?? "", lines };
    }
  }
  return <Billing products={(data ?? []).map((p) => ({ ...p, price: Number(p.price), stock: Number(p.stock) }))} edit={edit} />;
}

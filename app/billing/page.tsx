import { db } from "@/lib/db";
import Billing from "./Billing";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await db().from("products").select("id,name,barcode,price,unit,stock").eq("is_active", true).order("name");
  return <Billing products={(data ?? []).map((p) => ({ ...p, price: Number(p.price), stock: Number(p.stock) }))} />;
}

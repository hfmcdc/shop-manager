"use server";
import { db } from "@/lib/db";
import { BASE_UNITS } from "@/lib/units";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveProduct(fd: FormData) {
  const id = String(fd.get("id") || ""), name = String(fd.get("name") || "").trim();
  const barcode = String(fd.get("barcode") || "").trim() || null, unit = String(fd.get("unit"));
  const price = Number(fd.get("price")), stock = Number(fd.get("stock") || 0);
  const back = (e: string) => redirect(`/products?error=${encodeURIComponent(e)}${id ? `&edit=${id}` : ""}`);
  if (!name) back("Name is required");
  if (!BASE_UNITS.includes(unit)) back("Choose a valid unit");
  if (!(price >= 0)) back("Price must be 0 or more");
  if (!(stock >= 0)) back("Stock cannot be negative");
  const s = db();
  if (id) {
    const { error } = await s.from("products").update({ name, barcode, price, unit, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) back(error.code === "23505" ? "Barcode already used by another product" : error.message);
  } else {
    const { data, error } = await s.from("products").insert({ name, barcode, price, unit, stock }).select("id").single();
    if (error) back(error.code === "23505" ? "Barcode already used by another product" : error.message);
    if (stock > 0) await s.from("stock_movements").insert({ product_id: data!.id, delta: stock, reason: "restock", note: "Opening stock" });
  }
  revalidatePath("/products"); redirect("/products");
}

export async function deleteProduct(fd: FormData) { // soft delete: history stays intact
  await db().from("products").update({ is_active: false, barcode: null }).eq("id", String(fd.get("id")));
  revalidatePath("/products"); redirect("/products");
}

type Payload = { key: string; method: "cash" | "upi" | "credit"; paid: number; name: string; phone: string; items: { product_id: string; qty: number; unit: string }[] };
export async function createBillAction(p: Payload): Promise<{ id?: string; error?: string }> {
  if (!p.key || p.key.length < 16) return { error: "Invalid request" };
  if (!["cash", "upi", "credit"].includes(p.method)) return { error: "Invalid payment method" };
  if (!p.items?.length || p.items.some((i) => !(i.qty > 0))) return { error: "Add items with quantity above 0" };
  const s = db(); let customer: string | null = null;
  if (p.method === "credit" || p.name.trim()) {
    if (!p.name.trim()) return { error: "Customer name is required for credit" };
    const phone = p.phone.trim() || null;
    const found = phone ? (await s.from("customers").select("id").eq("phone", phone).maybeSingle()).data : null;
    customer = found?.id ?? (await s.from("customers").insert({ name: p.name.trim(), phone }).select("id").single()).data?.id ?? null;
  }
  const { data, error } = await s.rpc("create_bill", { p_key: p.key, p_customer: customer, p_items: p.items, p_method: p.method, p_paid: p.paid || 0 });
  if (error) return { error: error.message };
  revalidatePath("/"); return { id: (data as { id: string }).id };
}

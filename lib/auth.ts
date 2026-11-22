// Device authorization: signed, httpOnly cookie issued only via the secret setup link. Edge-safe (Web Crypto).
const enc = new TextEncoder();
async function sign(msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(process.env.AUTH_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const COOKIE = "kr_device";
export async function makeToken() { const ts = Date.now().toString(); return `${ts}.${await sign(ts)}`; }
export async function verifyToken(t?: string) {
  if (!t || !process.env.AUTH_SECRET) return false;
  const [ts, sig] = t.split(".");
  if (!ts || !sig) return false;
  const good = await sign(ts);
  if (good.length !== sig.length) return false;
  let d = 0; for (let i = 0; i < good.length; i++) d |= good.charCodeAt(i) ^ sig.charCodeAt(i);
  return d === 0;
}

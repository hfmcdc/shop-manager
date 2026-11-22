import { NextRequest, NextResponse } from "next/server";
import { COOKIE, makeToken } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("token") ?? "";
  const s = process.env.DEVICE_SETUP_TOKEN ?? "";
  if (s.length < 32 || t.length !== s.length || t !== s) return new NextResponse("Invalid link", { status: 403 });
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(COOKIE, await makeToken(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

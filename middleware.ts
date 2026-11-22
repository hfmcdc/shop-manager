import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/authorize")) return NextResponse.next();
  if (await verifyToken(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return new NextResponse("This device is not authorized. Open the setup link given by the shop owner.", { status: 401 });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192.png|icon-512.png|apple-icon.png).*)"] };

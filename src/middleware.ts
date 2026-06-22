import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/auth/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护后台路径。登录页本身放行，避免自锁。
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!(await isValidSessionToken(token))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin-login";
      // 带上 from，登录成功后可回跳（本 MVP 不强求实现回跳，但保留参数）。
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // 只在后台路径触发 middleware，避免给用户端页面加开销。
  matcher: ["/admin", "/admin/:path*"],
};

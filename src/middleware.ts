import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig, isStaffOrAbove, canManageUsers } from "@/lib/auth/config";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const userRole = request.auth?.user?.role;

  if (pathname.startsWith("/api/auth")) {
    if (ip && !rateLimit(`auth:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/products")) {
    if (ip && !rateLimit(`api:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!isStaffOrAbove(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/admin/users")) {
    if (ip && !rateLimit(`api:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!canManageUsers(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/admin/orders")) {
    if (ip && !rateLimit(`api:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!isStaffOrAbove(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/checkout")) {
    if (ip && !rateLimit(`checkout:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/cart/reserve")) {
    if (ip && !rateLimit(`cart-reserve:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Protect /admin/users (developer and admin only)
  if (pathname.startsWith("/admin/users")) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!canManageUsers(userRole)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Protect all other /admin routes (developer, admin, staff)
  if (pathname.startsWith("/admin")) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isStaffOrAbove(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/products/:path*",
    "/api/admin/users/:path*",
    "/api/admin/orders/:path*",
    "/api/auth/:path*",
    "/api/checkout/:path*",
    "/api/cart/reserve",
  ],
};

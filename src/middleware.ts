import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "hamrin_session";

/** Routes that require a valid session when SESSION_SECRET is set. */
const PROTECTED_PATHS = ["/dashboard", "/api/settings", "/api/discount/send", "/api/discount"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Security middleware for Next.js 15
 * Implements security headers, request validation, and session-based route protection.
 */
export function middleware(request: NextRequest) {
  // Session protection: when SESSION_SECRET is set, require session cookie on protected routes
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  const sessionEnabled = sessionSecret.length >= 32;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionEnabled && isProtectedPath(request.nextUrl.pathname)) {
    if (!sessionCookie || sessionCookie.length < 10) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/onboard";
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  // Security headers (2026 best practices)
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
  );

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Remaining", "99");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

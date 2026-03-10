import "server-only";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout — clear session cookie and redirect to home.
 * GET also supported for convenience (e.g. link in UI).
 */
export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });
  const opts = getSessionCookieOptions();
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    ...opts,
    maxAge: 0,
  });
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(env.NEXT_PUBLIC_APP_URL + "/");
  const opts = getSessionCookieOptions();
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    ...opts,
    maxAge: 0,
  });
  return res;
}

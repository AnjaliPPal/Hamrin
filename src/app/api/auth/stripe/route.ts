import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

export async function GET(req: NextRequest) {
  const redirectPath =
    req.nextUrl.searchParams.get("redirect") ?? "/dashboard";
  const pricingModel =
    req.nextUrl.searchParams.get("pricing_model") ?? "outcome";

  const csrf = crypto.randomBytes(24).toString("hex");

  const statePayload = { csrf, redirectPath, pricingModel };
  const state = base64url(JSON.stringify(statePayload));

  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/stripe/callback`;

  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.STRIPE_CLIENT_ID);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url.toString());

  res.cookies.set("hamrin_oauth_csrf", csrf, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode, enableAccountUpdaters, createConnectedStripeClient } from "@/lib/stripe";
import { createInstallation, updateComplianceFlags } from "@/lib/db";
import { env } from "@/lib/env";
import {
  createSessionToken,
  getSessionCookieOptions,
  isSessionEnabled,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export const runtime = "nodejs";

/**
 * Detect country from Stripe account
 */
async function detectCountry(accessToken: string): Promise<string> {
  try {
    const stripeClient = createConnectedStripeClient(accessToken);
    const account = await stripeClient.accounts.retrieve("self");
    
    // Try to get country from account
    if (account.country) {
      return account.country.toUpperCase();
    }
    if (account.business_profile?.support_address?.country) {
      return account.business_profile.support_address.country.toUpperCase();
    }
    if (account.company?.address?.country) {
      return account.company.address.country.toUpperCase();
    }
  } catch (error) {
    console.warn("⚠️ Failed to detect country from Stripe account:", error);
  }
  
  // Default to US if detection fails
  return "US";
}

function parseState(stateB64: string | null): { pricingModel?: "flat" | "outcome" | "ltd" } {
  if (!stateB64) return {};
  try {
    const json = Buffer.from(stateB64, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as { pricingModel?: string };
    const pm = parsed.pricingModel;
    if (pm === "outcome" || pm === "ltd" || pm === "flat") return { pricingModel: pm };
  } catch {
    // ignore invalid state
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      console.error("❌ OAuth error:", error);
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      console.error("❌ Missing authorization code");
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    const { pricingModel } = parseState(state);

    console.log("🔄 Exchanging OAuth code...");
    const oauthResponse = await exchangeOAuthCode(code);
    console.log("✅ OAuth success:", oauthResponse.stripe_user_id);

    console.log("🔄 Detecting country...");
    const country = await detectCountry(oauthResponse.access_token);
    console.log("✅ Country detected:", country);

    console.log("🔄 Enabling VAU/ABU...");
    const { vauEnabled, abuEnabled } = await enableAccountUpdaters(
      oauthResponse.access_token
    );

    console.log("💾 Creating installation...");
    const installation = await createInstallation({
      stripeAccountId: oauthResponse.stripe_user_id,
      accessToken: oauthResponse.access_token,
      country,
      pricingModel: pricingModel ?? "outcome",
    });

    await updateComplianceFlags(installation.id, { vauEnabled, abuEnabled });

    console.log("✅ Installation created:", installation.id);

    const redirectUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard`;

    if (isSessionEnabled()) {
      const token = createSessionToken({
        installationId: installation.id,
        stripeAccountId: installation.stripeAccountId,
        issuedAt: Date.now(),
      });
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
      return res;
    }

    return NextResponse.redirect(`${redirectUrl}?installation=${installation.id}`);
  } catch (err) {
    console.error("❌ OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "OAuth failed", details: msg },
      { status: 500 }
    );
  }
}

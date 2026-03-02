import { exchangeOAuthCode } from "@/lib/stripe";
import { createInstallation } from "@/lib/db";

/**
 * Local test of OAuth flow (requires valid code from Stripe)
 * Run: npx ts-node scripts/test-oauth.ts
 * 
 * Purpose: Test OAuth exchange without running full Next.js server
 * Use when: You want to verify Stripe OAuth works before integrating into routes
 */
async function testOAuth() {
  try {
    // In real flow, you'd click "Connect Stripe" and get this code
    // Get this from: https://connect.stripe.com/oauth/authorize?...
    const testCode = "ac_test_code_here"; // Replace with actual code from Stripe

    console.log("🔄 Testing OAuth exchange...");
    const oauthResponse = await exchangeOAuthCode(testCode);
    console.log("✅ OAuth response:", oauthResponse);

    console.log("💾 Saving installation...");
    const installation = await createInstallation({
      stripeAccountId: oauthResponse.stripe_user_id,
      accessToken: oauthResponse.access_token,
      country: "US",
    });
    console.log("✅ Installation saved:", installation);
    
    console.log("\n✅ Test passed! OAuth flow working.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testOAuth();

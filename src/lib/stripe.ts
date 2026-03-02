import Stripe from "stripe";
import { env } from "./env";

export const stripeAdmin = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export function createConnectedStripeClient(accessToken: string): Stripe {
  return new Stripe(accessToken, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  stripe_user_id: string;
  scope: string;
  livemode: boolean;
}

export async function exchangeOAuthCode(
  code: string
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  });

  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
    body: body.toString(),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = json?.error_description || json?.error || response.statusText;
    throw new Error(`Stripe OAuth failed: ${msg}`);
  }

  if (!json?.access_token || !json?.stripe_user_id) {
    throw new Error("Invalid OAuth response: missing access_token/stripe_user_id");
  }

  return json;
}

export async function enableAccountUpdaters(
  accessToken: string
): Promise<{ vauEnabled: boolean; abuEnabled: boolean }> {
  const client = createConnectedStripeClient(accessToken);

  try {
    await client.accounts.update("self", {
      settings: {
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false,
          },
        },
      },
    });

    console.log("✅ VAU/ABU settings updated");
    return { vauEnabled: true, abuEnabled: true };
  } catch (error) {
    console.error("⚠️ VAU/ABU enable failed:", error);
    return { vauEnabled: false, abuEnabled: false };
  }
}

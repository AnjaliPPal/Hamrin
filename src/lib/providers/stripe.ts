import "server-only";
import {
  exchangeOAuthCode as stripeExchangeOAuthCode,
  createConnectedStripeClient,
} from "@/lib/stripe";
import { createInstallation as dbCreateInstallation } from "@/lib/db";
import type {
  BillingProvider,
  OAuthResult,
  CreateInstallationParams,
  PaymentFailedParams,
  ApplyDiscountParams,
  PauseSubscriptionParams,
} from "./types";

/**
 * Stripe implementation of BillingProvider.
 * Used when we add a second provider (e.g. Paddle); webhooks/callback can then
 * dispatch by installation.provider to the right implementation.
 */
export const stripeProvider: BillingProvider = {
  id: "stripe",

  async exchangeOAuthCode(code: string): Promise<OAuthResult> {
    const res = await stripeExchangeOAuthCode(code);
    return {
      accessToken: res.access_token,
      accountId: res.stripe_user_id,
      livemode: res.livemode,
    };
  },

  async createInstallation(params: CreateInstallationParams): Promise<{ id: string }> {
    const installation = await dbCreateInstallation({
      stripeAccountId: params.accountId,
      accessToken: params.accessToken,
      country: params.country,
      pricingModel: params.pricingModel,
    });
    return { id: installation.id };
  },

  createConnectedClient(accessToken: string) {
    return createConnectedStripeClient(accessToken);
  },

  // onPaymentFailed, applyDiscount, pauseSubscription are implemented in
  // webhooks/stripe and api/discount/send (and MVP 2 cancel-flow). When we
  // add a second provider, move that logic here per-provider or keep in
  // route and call provider.onPaymentFailed(...). Optional on interface so
  // Paddle can omit full recovery at first.
};

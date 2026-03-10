/**
 * Billing provider layer. Stripe-only for now; add providers/paddle.ts (or chargebee.ts)
 * when we support a second provider. See CHURNKEY_RESEARCH.md and CONTEXT_FOR_LMERNA.md.
 */

export type {
  BillingProviderId,
  BillingProvider,
  OAuthResult,
  CreateInstallationParams,
  PaymentFailedParams,
  ApplyDiscountParams,
  PauseSubscriptionParams,
} from "./types";

export { stripeProvider } from "./stripe";

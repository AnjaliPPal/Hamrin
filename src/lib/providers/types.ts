/**
 * Billing provider abstraction for future multi-provider support (Paddle, Chargebee).
 * Today we are Stripe-only; this interface defines the shape a second provider would implement.
 * See CHURNKEY_RESEARCH.md and CONTEXT_FOR_LMERNA.md.
 */

export type BillingProviderId = "stripe" | "paddle" | "chargebee";

export interface OAuthResult {
  accessToken: string;
  accountId: string;
  livemode: boolean;
}

export interface CreateInstallationParams {
  accountId: string;
  accessToken: string;
  country: string;
  pricingModel?: "flat" | "outcome" | "ltd";
}

export interface PaymentFailedParams {
  installationId: string;
  customerEmail: string;
  amount: number;
  invoiceId: string;
  failureCode?: string;
  cardFingerprint?: string | null;
}

export interface ApplyDiscountParams {
  installationId: string;
  customerId: string;
  subscriptionId: string;
  percentOff: number;
  durationMonths?: number;
}

export interface PauseSubscriptionParams {
  installationId: string;
  subscriptionId: string;
  resumeAt: Date;
}

/**
 * Operations a billing provider must support for full retention (cancel flow, recovery, reactivation).
 * Non-Stripe providers (e.g. Paddle) may implement a subset first (e.g. cancel flow + link to update payment).
 */
export interface BillingProvider {
  id: BillingProviderId;

  /** Exchange OAuth code for access token and account id (Stripe Connect; N/A for Paddle). */
  exchangeOAuthCode?(code: string): Promise<OAuthResult>;

  /** Create or update installation record after connect. */
  createInstallation(params: CreateInstallationParams): Promise<{ id: string }>;

  /** Handle payment failed event: create failed_payment, send email, schedule retry. */
  onPaymentFailed?(params: PaymentFailedParams): Promise<void>;

  /** Apply discount/coupon to subscription (cancel flow save). */
  applyDiscount?(params: ApplyDiscountParams): Promise<void>;

  /** Pause subscription until resumeAt (cancel flow save). */
  pauseSubscription?(params: PauseSubscriptionParams): Promise<void>;

  /** Create a connected API client for this provider (Stripe instance, Paddle client, etc.). */
  createConnectedClient(accessToken: string): unknown;
}

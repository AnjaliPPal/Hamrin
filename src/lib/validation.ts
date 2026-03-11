/**
 * Input validation schemas using Zod
 * Follows Next.js 15 security best practices
 */
import { z } from "zod";

// Payment method update validation
export const paymentMethodUpdateSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method ID is required"),
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

// OAuth callback validation
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  error: z.string().optional(),
  state: z.string().optional(),
});

// Installation status query validation
export const installationStatusSchema = z.object({
  account: z.string().min(1, "Account ID is required"),
});

// Email validation
export const emailSchema = z.string().email("Invalid email address");

// Amount validation (positive decimal)
export const amountSchema = z.number().positive("Amount must be positive");

// Country code validation (ISO 3166-1 alpha-2)
export const countryCodeSchema = z
  .string()
  .length(2, "Country code must be 2 characters")
  .regex(/^[A-Z]{2}$/, "Country code must be uppercase letters");

// Stripe account ID validation
export const stripeAccountIdSchema = z
  .string()
  .regex(/^acct_[a-zA-Z0-9]+$/, "Invalid Stripe account ID format");

// Invoice ID validation
export const invoiceIdSchema = z
  .string()
  .regex(/^in_[a-zA-Z0-9]+$/, "Invalid Stripe invoice ID format");

// Payment method ID validation
export const paymentMethodIdSchema = z
  .string()
  .regex(/^pm_[a-zA-Z0-9]+$/, "Invalid Stripe payment method ID format");

// Stripe subscription ID validation
export const stripeSubscriptionIdSchema = z
  .string()
  .regex(/^sub_[a-zA-Z0-9]+$/, "Invalid Stripe subscription ID format");

// Stripe customer ID validation
export const stripeCustomerIdSchema = z
  .string()
  .regex(/^cus_[a-zA-Z0-9]+$/, "Invalid Stripe customer ID format");

// Cancel flow offer object
const cancelFlowOfferSchema = z.object({
  type: z.enum(["discount", "pause"]),
  discountPercent: z.number().min(1).max(100).optional(),
  discountMonths: z.number().min(1).max(24).optional(),
  pauseMonths: z.number().min(1).max(6).optional(),
});

// Cancel Flow Config PATCH
export const cancelFlowConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  offers: z.array(cancelFlowOfferSchema).max(5).optional(),
  reasonOptions: z.array(z.string().min(1).max(100)).min(1).max(10).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
  brandLogo: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// Cancel Flow Session create
export const cancelFlowSessionCreateSchema = z.object({
  installationId: z.string().min(1),
  stripeCustomerId: stripeCustomerIdSchema,
  stripeSubscriptionId: stripeSubscriptionIdSchema,
});

// Cancel Flow Save (customer accepts offer)
export const cancelFlowSaveSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().min(1).max(100),
  reasonText: z.string().max(500).optional(),
  offerType: z.enum(["discount", "pause"]),
  feedbackText: z.string().max(500).optional(),
  competitorName: z.string().max(100).optional(),
});

// Cancel Flow Cancel (customer proceeds with cancellation)
export const cancelFlowCancelSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().min(1).max(100),
  reasonText: z.string().max(500).optional(),
  feedbackText: z.string().max(500).optional(),
  competitorName: z.string().max(100).optional(),
});

// Wall check query params (Module 5)
export const wallCheckQuerySchema = z.object({
  customer_email: z.string().email("Invalid email"),
  installation_id: z.string().min(1, "installation_id required"),
});

// Wall pause-check query params
export const wallPauseCheckQuerySchema = z.object({
  customer_email: z.string().email("Invalid email"),
  installation_id: z.string().min(1, "installation_id required"),
});

// Wall resume body
export const wallResumeSchema = z.object({
  installation_id: z.string().min(1),
  subscription_id: stripeSubscriptionIdSchema,
});

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

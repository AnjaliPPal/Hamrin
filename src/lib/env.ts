/**
 * Environment variable validation and management
 * Follows Next.js 15 best practices for security
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/** Email provider: "brevo" | "resend" | "postmark" | "none" (none = log only). Brevo = free 300/day, no business email. */
function getEmailProvider(): "brevo" | "resend" | "postmark" | "none" {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  const brevoKey = process.env.BREVO_API_KEY ?? "";
  const resendKey = process.env.RESEND_API_KEY ?? "";
  const postmarkKey = process.env.POSTMARK_API_KEY ?? "";
  const validBrevo = brevoKey && brevoKey.startsWith("xkeysib-") && brevoKey.length > 20;
  const validResend = resendKey && resendKey !== "re_XXXX" && resendKey.length > 10;
  const validPostmark = postmarkKey && postmarkKey.length > 10;
  if (provider === "brevo" && validBrevo) return "brevo";
  if (provider === "postmark" && validPostmark) return "postmark";
  if (validResend) return "resend";
  if (validBrevo) return "brevo"; // default to Brevo if key set and no provider
  return "none";
}

export const env = {
  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // Stripe
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_PUBLISHABLE_KEY: requireEnv("STRIPE_PUBLISHABLE_KEY"),
  STRIPE_CLIENT_ID: requireEnv("STRIPE_CLIENT_ID"),
  /** Use "whsec_..." from Stripe Dashboard > Webhooks > [endpoint] > Reveal. For local dev: run `stripe listen` */
  STRIPE_WEBHOOK_SECRET: optionalEnv("STRIPE_WEBHOOK_SECRET", ""),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  // Application
  NEXT_PUBLIC_APP_URL: requireEnv("NEXT_PUBLIC_APP_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Email - Brevo (free 300/day), Resend, or Postmark. Set EMAIL_PROVIDER=brevo|resend|postmark
  EMAIL_PROVIDER: getEmailProvider(),
  BREVO_API_KEY: optionalEnv("BREVO_API_KEY", ""),
  BREVO_FROM_EMAIL: optionalEnv("BREVO_FROM_EMAIL", ""),
  RESEND_API_KEY: optionalEnv("RESEND_API_KEY", ""),
  RESEND_FROM_EMAIL: optionalEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
  POSTMARK_API_KEY: optionalEnv("POSTMARK_API_KEY", ""),
  POSTMARK_FROM_EMAIL: optionalEnv("POSTMARK_FROM_EMAIL", "onboarding@resend.dev"),

  // Security
  CRON_SECRET: optionalEnv("CRON_SECRET", ""),

  // Twilio (optional for SMS)
  TWILIO_ACCOUNT_SID: optionalEnv("TWILIO_ACCOUNT_SID", ""),
  TWILIO_AUTH_TOKEN: optionalEnv("TWILIO_AUTH_TOKEN", ""),

  // QStash (Upstash) — background job scheduling
  QSTASH_TOKEN: optionalEnv("QSTASH_TOKEN", ""),
  QSTASH_CURRENT_SIGNING_KEY: optionalEnv("QSTASH_CURRENT_SIGNING_KEY", ""),
  QSTASH_NEXT_SIGNING_KEY: optionalEnv("QSTASH_NEXT_SIGNING_KEY", ""),

  // LTD — Stripe Payment Link for $749 one-time purchase (optional; if unset, LTD CTA links to Cal.com)
  STRIPE_LTD_PAYMENT_LINK: optionalEnv("STRIPE_LTD_PAYMENT_LINK", ""),
} as const;

/**
 * Call this inside any cron route handler before doing any work.
 * This avoids crashing the build (Next.js runs server modules at build time).
 */
export function assertCronSecret(incomingSecret: string | null): void {
  if (env.NODE_ENV === "production") {
    if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) {
      throw new Error("CRON_SECRET must be at least 32 characters in production");
    }
    if (incomingSecret !== env.CRON_SECRET) {
      throw new Error("Unauthorized");
    }
  }
}

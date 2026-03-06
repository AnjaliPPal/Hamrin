import "server-only";
import Stripe from "stripe";
import { Client as QStashClient } from "@upstash/qstash";
import { env } from "@/lib/env";
import { sendPreDunningEmail } from "@/services/email";

/**
 * How pre-dunning works:
 * 1. Stripe fires `invoice.upcoming` ~30 days before renewal.
 * 2. We retrieve the customer's default payment method and check expiry.
 * 3. If the card expires within 30 days of the renewal date:
 *    - Send T-30 email now.
 *    - Schedule T-7 job via QStash (23 days later).
 *    - Schedule T-1 job via QStash (29 days later).
 * 4. QStash delivers those jobs by calling /api/cron/pre-dunning.
 */

export interface PreDunningJobPayload {
  installationId: string;
  customerEmail: string;
  invoiceId: string;
  expiryDate: string;     // "MM/YYYY"
  daysUntilExpiry: number;
  updateCardLink: string;
}

function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function daysUntil(month: number, year: number): number {
  const now = new Date();
  const expiry = new Date(year, month, 1); // first day of month after expiry
  return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Called from the invoice.upcoming webhook handler.
 * Checks if the customer's card expires soon and schedules dunning emails.
 */
export async function handleUpcomingInvoice(
  invoice: Stripe.Invoice,
  stripeClient: Stripe,
  installationId: string
): Promise<void> {
  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    console.warn("⚠️ invoice.upcoming: no customer email, skipping pre-dunning");
    return;
  }

  // Get the customer's default payment method
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    console.warn("⚠️ invoice.upcoming: no customer ID");
    return;
  }

  let expMonth: number | null = null;
  let expYear: number | null = null;

  try {
    const customer = await stripeClient.customers.retrieve(customerId);
    if (customer.deleted) return;

    const defaultPaymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id;

    if (!defaultPaymentMethodId) return;

    const pm = await stripeClient.paymentMethods.retrieve(defaultPaymentMethodId);
    if (pm.type === "card" && pm.card) {
      expMonth = pm.card.exp_month;
      expYear = pm.card.exp_year;
    }
  } catch (err) {
    console.error("⚠️ Failed to retrieve payment method for pre-dunning:", err);
    return;
  }

  if (!expMonth || !expYear) return;

  const days = daysUntil(expMonth, expYear);
  const expiryDate = formatExpiry(expMonth, expYear);
  const updateCardLink = `${env.NEXT_PUBLIC_APP_URL}/recover?invoice_id=${invoice.id}`;

  if (days > 30) {
    // Card not expiring soon — nothing to do
    return;
  }

  console.log(`📧 Card expires in ${days} days — scheduling pre-dunning for ${customerEmail}`);

  // T-30 (or whatever we are at now) — send immediately
  await sendPreDunningEmail(customerEmail, {
    expiryDate,
    daysUntilExpiry: days,
    updateCardLink,
  });

  // Schedule T-7 and T-1 via QStash if token is configured
  if (!env.QSTASH_TOKEN) {
    console.log("⚠️ QSTASH_TOKEN not set — T-7 and T-1 emails will not be scheduled");
    return;
  }

  const qstash = new QStashClient({ token: env.QSTASH_TOKEN });
  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/api/cron/pre-dunning`;

  const basePayload: Omit<PreDunningJobPayload, "daysUntilExpiry"> = {
    installationId,
    customerEmail,
    invoiceId: invoice.id,
    expiryDate,
    updateCardLink,
  };

  const schedules: Array<{ daysUntilExpiry: number; delaySeconds: number }> = [];

  if (days > 7) {
    schedules.push({
      daysUntilExpiry: 7,
      delaySeconds: (days - 7) * 24 * 60 * 60,
    });
  }
  if (days > 1) {
    schedules.push({
      daysUntilExpiry: 1,
      delaySeconds: (days - 1) * 24 * 60 * 60,
    });
  }

  for (const schedule of schedules) {
    const payload: PreDunningJobPayload = {
      ...basePayload,
      daysUntilExpiry: schedule.daysUntilExpiry,
    };

    await qstash.publishJSON({
      url: callbackUrl,
      body: payload,
      delay: schedule.delaySeconds,
    });

    console.log(`✅ Scheduled T-${schedule.daysUntilExpiry} email in ${schedule.delaySeconds}s`);
  }
}

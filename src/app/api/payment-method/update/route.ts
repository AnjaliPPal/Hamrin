import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { processRetry } from "@/services/retry-engine";
import { paymentMethodUpdateSchema, paymentMethodIdSchema, invoiceIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Hard decline codes — updating the card won't fix these
const HARD_DECLINE_CODES = new Set([
  "do_not_honor", "do_not_try_again", "fraudulent", "lost_card", "stolen_card",
  "pickup_card", "restricted_card", "security_violation", "transaction_not_allowed",
  "revocation_of_all_authorizations", "revocation_of_authorization",
  "03", "04", "07", "12", "57", "62",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = paymentMethodUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { paymentMethodId, invoiceId } = validationResult.data;

    const pmValidation = paymentMethodIdSchema.safeParse(paymentMethodId);
    const invValidation = invoiceIdSchema.safeParse(invoiceId);
    if (!pmValidation.success || !invValidation.success) {
      return NextResponse.json({ error: "Invalid Stripe ID format" }, { status: 400 });
    }

    // Find the failed payment
    const failedPayment = await prisma.failedPayment.findFirst({
      where: { invoiceId },
      include: { installation: true },
    });

    if (!failedPayment) {
      return NextResponse.json({ error: "Failed payment not found" }, { status: 404 });
    }

    // ── Idempotency: already recovered ──
    if (failedPayment.status === "recovered") {
      return NextResponse.json({
        success: true,
        message: "Payment was already recovered — no action needed.",
        alreadyRecovered: true,
      });
    }

    // ── Idempotency: abandoned (hard decline or retry window expired) ──
    if (failedPayment.status === "abandoned") {
      const isHardDecline = failedPayment.failureCode
        ? HARD_DECLINE_CODES.has(failedPayment.failureCode)
        : false;
      return NextResponse.json(
        {
          error: isHardDecline
            ? "This payment was permanently declined by the card issuer. Updating your card will not resolve this — please contact support."
            : "The retry window for this payment has closed. Please contact support.",
        },
        { status: 422 }
      );
    }

    // ── Hard decline guard (failed but code is permanent) ──
    if (failedPayment.failureCode && HARD_DECLINE_CODES.has(failedPayment.failureCode)) {
      return NextResponse.json(
        { error: "This payment was permanently declined. Updating your card will not resolve this." },
        { status: 422 }
      );
    }

    // ── Link expiry check (7 days) ──
    const ageDays = (Date.now() - failedPayment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 7) {
      return NextResponse.json(
        { error: "This recovery link has expired. Please contact support for a new link." },
        { status: 410 }
      );
    }

    // ── Attach payment method and set as default ──
    const stripeClient = createConnectedStripeClient(failedPayment.installation.accessToken);
    const invoice = await stripeClient.invoices.retrieve(invoiceId);

    if (!invoice.customer || typeof invoice.customer !== "string") {
      return NextResponse.json({ error: "Invoice has no customer" }, { status: 400 });
    }

    await stripeClient.paymentMethods.attach(paymentMethodId, { customer: invoice.customer });
    await stripeClient.customers.update(invoice.customer, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // ── Trigger immediate retry — source='card_update' for attribution ──
    const retryResult = await processRetry(failedPayment.id, "card_update");

    if (retryResult.success) {
      return NextResponse.json({
        success: true,
        message: "Payment method updated and payment retried successfully.",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Payment method updated. Retry scheduled.",
        retryError: retryResult.error,
      });
    }
  } catch (error) {
    console.error("❌ Payment method update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update payment method",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

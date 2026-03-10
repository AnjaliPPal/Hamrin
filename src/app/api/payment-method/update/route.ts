import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { processRetry } from "@/services/retry-engine";
import { paymentMethodUpdateSchema, paymentMethodIdSchema, invoiceIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validationResult = paymentMethodUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { paymentMethodId, invoiceId } = validationResult.data;

    // Additional format validation for Stripe IDs
    const paymentMethodValidation = paymentMethodIdSchema.safeParse(paymentMethodId);
    const invoiceValidation = invoiceIdSchema.safeParse(invoiceId);

    if (!paymentMethodValidation.success || !invoiceValidation.success) {
      return NextResponse.json(
        { error: "Invalid Stripe ID format" },
        { status: 400 }
      );
    }

    // Find the failed payment
    const failedPayment = await prisma.failedPayment.findFirst({
      where: { invoiceId },
      include: { installation: true },
    });

    if (!failedPayment) {
      return NextResponse.json(
        { error: "Failed payment not found" },
        { status: 404 }
      );
    }

    // Get customer ID from invoice
    const stripeClient = createConnectedStripeClient(
      failedPayment.installation.accessToken
    );
    
    const invoice = await stripeClient.invoices.retrieve(invoiceId);
    
    if (!invoice.customer || typeof invoice.customer !== "string") {
      return NextResponse.json(
        { error: "Invoice has no customer" },
        { status: 400 }
      );
    }

    // Attach payment method to customer and set as default
    await stripeClient.paymentMethods.attach(paymentMethodId, {
      customer: invoice.customer,
    });

    await stripeClient.customers.update(invoice.customer, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Trigger immediate retry — source='card_update' so attribution is stamped inside processRetry
    const retryResult = await processRetry(failedPayment.id, "card_update");

    if (retryResult.success) {
      return NextResponse.json({
        success: true,
        message: "Payment method updated and payment retried successfully",
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

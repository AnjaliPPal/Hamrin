import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { sendReactivationSuccessEmail } from "@/services/email";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  churnedCustomerId: z.string().min(1),
  emailIndex: z.number().int().min(0),
  priceId: z.string().min(1),         // Stripe price ID to re-subscribe to
  offerCouponId: z.string().optional(), // Stripe coupon ID if offer is percent_off
});

/**
 * POST /api/reactivate
 * Called by the /reactivate page when the customer confirms reactivation.
 *
 * Steps:
 * 1. Validate request
 * 2. Look up ChurnedCustomer + Installation
 * 3. Create a new Stripe subscription for the customer (with optional coupon)
 * 4. Mark ChurnedCustomer.reactivatedAt + source
 * 5. Mark ReactivationEmail.reactivatedFromThis = true
 * 6. Send success email
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { churnedCustomerId, emailIndex, priceId, offerCouponId } = parsed.data;

  const churned = await prisma.churnedCustomer.findUnique({
    where: { id: churnedCustomerId },
    include: {
      installation: { select: { accessToken: true } },
      reactivationEmails: { where: { emailIndex }, select: { id: true } },
    },
  });

  if (!churned) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  if (churned.reactivatedAt) {
    return Response.json({ error: "Already reactivated" }, { status: 409 });
  }

  const stripe = createConnectedStripeClient(churned.installation.accessToken);

  try {
    // Create new subscription
    const subParams: Stripe.SubscriptionCreateParams = {
      customer: churned.stripeCustomerId,
      items: [{ price: priceId }],
      ...(offerCouponId ? { discounts: [{ coupon: offerCouponId }] } : {}),
    };

    await stripe.subscriptions.create(subParams);

    // Mark reactivated
    await prisma.churnedCustomer.update({
      where: { id: churnedCustomerId },
      data: {
        reactivatedAt: new Date(),
        reactivationSource: "reactivation_email",
      },
    });

    // Mark the specific email step that drove the conversion
    if (churned.reactivationEmails.length > 0) {
      await prisma.reactivationEmail.update({
        where: { id: churned.reactivationEmails[0].id },
        data: { reactivatedFromThis: true, clicked: true },
      });
    }

    // Send success email
    sendReactivationSuccessEmail(churned.customerEmail, {}).catch((err) =>
      console.error("❌ Reactivation success email error:", err)
    );

    console.log("✅ Customer reactivated:", churned.customerEmail);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ Stripe reactivation error:", err);
    return Response.json(
      { error: "Stripe error", details: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

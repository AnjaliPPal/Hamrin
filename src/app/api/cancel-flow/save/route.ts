import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { cancelFlowSaveSchema } from "@/lib/validation";

export const runtime = "nodejs";

interface OfferConfig {
  type: "discount" | "pause";
  discountPercent?: number;
  discountMonths?: number;
  pauseMonths?: number;
}

/**
 * POST /api/cancel-flow/save
 * Called when customer accepts the retention offer.
 * Applies the offer via Stripe API and records the save.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const validation = cancelFlowSaveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, reason, reasonText, offerType, feedbackText, competitorName } =
      validation.data;

    // Load session + installation
    const session = await prisma.cancelFlowSession.findUnique({
      where: { id: sessionId },
      include: { installation: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.savedAt || session.cancelledAt) {
      return NextResponse.json(
        { error: "Session already completed" },
        { status: 409 }
      );
    }

    // Look up the offer config for this installation
    const config = await prisma.cancelFlowConfig.findUnique({
      where: { installationId: session.installationId },
    });

    const offers = (config?.offers ?? []) as OfferConfig[];
    const matchedOffer = offers.find((o) => o.type === offerType) ?? null;

    // Apply offer via Stripe using the merchant's connected account token
    const stripeClient = createConnectedStripeClient(
      session.installation.accessToken
    );

    try {
      if (offerType === "discount" && matchedOffer?.discountPercent) {
        // Create a coupon and apply it to the subscription
        const coupon = await stripeClient.coupons.create({
          percent_off: matchedOffer.discountPercent,
          duration: "repeating",
          duration_in_months: matchedOffer.discountMonths ?? 3,
          metadata: {
            source: "lamrin_cancel_flow",
            session_id: sessionId,
          },
        });

        await stripeClient.subscriptions.update(
          session.stripeSubscriptionId,
          { coupon: coupon.id }
        );

        console.log(
          `✅ Cancel flow save (discount): subscription=${session.stripeSubscriptionId} coupon=${coupon.id}`
        );
      } else if (offerType === "pause" && matchedOffer?.pauseMonths) {
        // Pause the subscription using Stripe's pause_collection
        const resumesAt = new Date();
        resumesAt.setMonth(resumesAt.getMonth() + matchedOffer.pauseMonths);

        await stripeClient.subscriptions.update(
          session.stripeSubscriptionId,
          {
            pause_collection: {
              behavior: "void",
              resumes_at: Math.floor(resumesAt.getTime() / 1000),
            },
          }
        );

        console.log(
          `✅ Cancel flow save (pause): subscription=${session.stripeSubscriptionId} resumesAt=${resumesAt.toISOString()}`
        );
      }
    } catch (stripeError) {
      // Log but don't block — record the save attempt even if Stripe call fails
      console.error("⚠️ Stripe offer apply error:", stripeError);
    }

    // Record the save
    const saved = await prisma.cancelFlowSession.update({
      where: { id: sessionId },
      data: {
        reason,
        reasonText,
        offerType,
        offerShown: true,
        offerAccepted: true,
        offerSnapshot: matchedOffer ?? null,
        feedbackText,
        competitorName,
        savedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, sessionId: saved.id });
  } catch (error) {
    console.error("❌ Cancel flow save error:", error);
    return NextResponse.json(
      { error: "Failed to process save" },
      { status: 500 }
    );
  }
}

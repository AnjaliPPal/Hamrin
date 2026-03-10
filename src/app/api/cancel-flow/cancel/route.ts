import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { cancelFlowCancelSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/cancel-flow/cancel
 * Called when customer declines all offers and proceeds with cancellation.
 * Cancels the Stripe subscription at period end and records the churn + feedback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const validation = cancelFlowCancelSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, reason, reasonText, feedbackText, competitorName } =
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

    // Cancel subscription at period end (not immediately — best practice for SaaS)
    const stripeClient = createConnectedStripeClient(
      session.installation.accessToken
    );

    let stripeError: string | null = null;
    try {
      await stripeClient.subscriptions.update(session.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancel_reason: reason,
          lamrin_session_id: sessionId,
        },
      });

      console.log(
        `✅ Cancel flow cancel: subscription=${session.stripeSubscriptionId} reason="${reason}"`
      );
    } catch (err) {
      stripeError = err instanceof Error ? err.message : "Unknown error";
      console.error("⚠️ Stripe subscription cancel error:", err);
      // Don't block — record the cancellation intent even if Stripe call fails
    }

    // Record the cancellation
    await prisma.cancelFlowSession.update({
      where: { id: sessionId },
      data: {
        reason,
        reasonText,
        offerShown: true,
        offerAccepted: false,
        feedbackText,
        competitorName,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      ...(stripeError && { warning: `Stripe call failed: ${stripeError}` }),
    });
  } catch (error) {
    console.error("❌ Cancel flow cancel error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation" },
      { status: 500 }
    );
  }
}

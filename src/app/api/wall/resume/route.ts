import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { wallResumeSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/wall/resume
 * Resumes a paused subscription via Stripe API and marks PausedSubscription as resumed.
 * Body: { installation_id, subscription_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const validation = wallResumeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { installation_id, subscription_id } = validation.data;

    const paused = await prisma.pausedSubscription.findFirst({
      where: {
        installationId: installation_id,
        stripeSubscriptionId: subscription_id,
      },
      include: { installation: true },
    });

    if (!paused) {
      return NextResponse.json(
        { error: "Paused subscription not found" },
        { status: 404 }
      );
    }

    if (paused.resumedAt) {
      return NextResponse.json({
        success: true,
        message: "Subscription already resumed",
      });
    }

    const stripeClient = createConnectedStripeClient(
      paused.installation.accessToken
    );

    try {
      await stripeClient.subscriptions.update(subscription_id, {
        pause_collection: null,
      });
    } catch (stripeError) {
      console.error("⚠️ Stripe resume error:", stripeError);
      return NextResponse.json(
        {
          error: "Failed to resume subscription",
          details: stripeError instanceof Error ? stripeError.message : "Unknown error",
        },
        { status: 502 }
      );
    }

    await prisma.pausedSubscription.update({
      where: { id: paused.id },
      data: { resumedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Wall resume error:", error);
    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    );
  }
}

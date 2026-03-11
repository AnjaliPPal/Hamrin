import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createConnectedStripeClient } from "@/lib/stripe";
import { wallPauseCheckQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * GET /api/wall/pause-check?customer_email=X&installation_id=Y
 * Returns whether this customer has a paused subscription (for Pause Wall).
 * Resolves email to Stripe customer ID via connected account, then checks PausedSubscription.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = wallPauseCheckQuerySchema.safeParse({
      customer_email: searchParams.get("customer_email"),
      installation_id: searchParams.get("installation_id"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { customer_email, installation_id } = parsed.data;

    const installation = await prisma.installation.findUnique({
      where: { id: installation_id },
      select: { accessToken: true },
    });

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    const stripeClient = createConnectedStripeClient(installation.accessToken);
    const customers = await stripeClient.customers.list({
      email: customer_email.toLowerCase().trim(),
      limit: 5,
    });

    const customerIds = customers.data.map((c) => c.id);
    if (customerIds.length === 0) {
      return NextResponse.json({
        isPaused: false,
        resumeDate: null,
        resumeUrl: null,
        subscriptionId: null,
      });
    }

    const paused = await prisma.pausedSubscription.findFirst({
      where: {
        installationId: installation_id,
        stripeCustomerId: { in: customerIds },
        resumedAt: null,
      },
      orderBy: { resumeAt: "asc" },
    });

    if (!paused) {
      return NextResponse.json({
        isPaused: false,
        resumeDate: null,
        resumeUrl: null,
        subscriptionId: null,
      });
    }

    return NextResponse.json({
      isPaused: true,
      resumeDate: paused.resumeAt.toISOString(),
      resumeUrl: null,
      subscriptionId: paused.stripeSubscriptionId,
    });
  } catch (error) {
    console.error("❌ Wall pause-check error:", error);
    return NextResponse.json(
      { error: "Failed to check pause status" },
      { status: 500 }
    );
  }
}

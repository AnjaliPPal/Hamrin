import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelFlowSessionCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/cancel-flow/session
 * Called by the widget when the customer clicks "Cancel" — opens a new cancel flow session.
 * Public (no merchant auth) — the widget calls this cross-origin with the installation_id.
 * Returns the sessionId + the config (offers, reasons, branding) needed to render the widget.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const validation = cancelFlowSessionCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { installationId, stripeCustomerId, stripeSubscriptionId } =
      validation.data;

    // Verify installation exists
    const installation = await prisma.installation.findUnique({
      where: { id: installationId },
      select: { id: true },
    });

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    // Fetch config for this installation
    const config = await prisma.cancelFlowConfig.findUnique({
      where: { installationId },
    });

    if (config && !config.enabled) {
      // Cancel flow is disabled — let the merchant's app proceed with normal cancellation
      return NextResponse.json({ disabled: true }, { status: 200 });
    }

    // Create session record
    const session = await prisma.cancelFlowSession.create({
      data: {
        installationId,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });

    // Return session ID + config the widget needs to render
    return NextResponse.json({
      sessionId: session.id,
      config: {
        offers: config?.offers ?? [
          { type: "discount", discountPercent: 20, discountMonths: 3 },
          { type: "pause", pauseMonths: 1 },
        ],
        reasonOptions: config?.reasonOptions ?? [
          "Too expensive",
          "Not using it enough",
          "Missing features",
          "Switching to competitor",
          "Other",
        ],
        brandColor: config?.brandColor ?? "#2563eb",
        brandLogo: config?.brandLogo ?? null,
      },
    });
  } catch (error) {
    console.error("❌ Cancel flow session create error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

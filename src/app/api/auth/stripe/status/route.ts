
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stripeAccountId = searchParams.get("account");

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Missing account parameter" },
        { status: 400 }
      );
    }

    const installation = await prisma.installation.findUnique({
      where: { stripeAccountId },
      select: {
        id: true,
        stripeAccountId: true,
        country: true,
        pricingModel: true,
        vauEnabled: true,
        abuEnabled: true,
        createdAt: true,
      },
    });

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: true,
      installation,
      compliance: {
        visaVAU: installation.vauEnabled,
        mastercardABU: installation.abuEnabled,
        readyForRetry: installation.vauEnabled && installation.abuEnabled,
      },
    });
  } catch (error) {
    console.error("❌ Status check failed:", error);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    );
  }
}

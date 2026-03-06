import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PLATFORM_LTD_ID = "platform_ltd";

export async function GET() {
  try {
    const installation = await prisma.installation.findUnique({
      where: { stripeAccountId: PLATFORM_LTD_ID },
      select: { id: true },
    });

    if (!installation) {
      return NextResponse.json({ sold: 0, total: 50 });
    }

    const inv = await prisma.ltdInventory.findUnique({
      where: { installationId: installation.id },
      select: { ltdSold: true, maxCapacity: true },
    });

    return NextResponse.json({
      sold: inv?.ltdSold ?? 0,
      total: inv?.maxCapacity ?? 50,
    });
  } catch {
    return NextResponse.json({ sold: 0, total: 50 });
  }
}

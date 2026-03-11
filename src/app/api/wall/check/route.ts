import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { wallCheckQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * GET /api/wall/check?customer_email=X&installation_id=Y
 * Returns whether this customer has open failed payments (for Failed Payment Wall).
 * Public — called by the embeddable snippet.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = wallCheckQuerySchema.safeParse({
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

    const failed = await prisma.failedPayment.findMany({
      where: {
        installationId: installation_id,
        customerEmail: customer_email.toLowerCase().trim(),
        status: "failed",
      },
      select: { invoiceId: true, amount: true },
    });

    const invoices = failed
      .filter((f) => f.invoiceId)
      .map((f) => ({ invoiceId: f.invoiceId!, amount: Number(f.amount) }));

    return NextResponse.json({
      hasOpenFailedPayments: invoices.length > 0,
      invoices,
    });
  } catch (error) {
    console.error("❌ Wall check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}

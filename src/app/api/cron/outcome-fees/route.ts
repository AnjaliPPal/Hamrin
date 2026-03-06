import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCronSecret } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Nightly outcome fee cron.
 * For every installation on outcome pricing:
 *   - Sums recovered payments this calendar month.
 *   - Calculates 10% fee.
 *   - Upserts recovered_monthly + usage_tracking tables.
 *
 * usage_tracking.stripe_invoice_id is intentionally NULL here.
 * It will be filled when we integrate Stripe Usage-Based Billing in a future sprint.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization")?.replace("Bearer ", "") ?? null);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Starting outcome fee metering...");

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const month = monthStart.toISOString().slice(0, 7); // "YYYY-MM"

    const outcomeInstallations = await prisma.installation.findMany({
      where: { pricingModel: "outcome" },
      select: { id: true },
    });

    let processed = 0;

    for (const installation of outcomeInstallations) {
      const recovered = await prisma.failedPayment.findMany({
        where: {
          installationId: installation.id,
          status: "recovered",
          createdAt: { gte: monthStart },
        },
        select: { amount: true },
      });

      const recoveredAmount = recovered.reduce((sum, p) => sum + Number(p.amount), 0);
      const feeOwed = Math.round(recoveredAmount * 0.10 * 100) / 100; // 10% rounded to cents
      const customerCount = recovered.length;

      // Upsert RecoveredMonthly (dashboard display)
      await prisma.recoveredMonthly.upsert({
        where: { installationId_month: { installationId: installation.id, month } },
        create: {
          installationId: installation.id,
          month,
          recoveredAmount,
          customerCount,
          merchantFeeOwed: feeOwed,
        },
        update: {
          recoveredAmount,
          customerCount,
          merchantFeeOwed: feeOwed,
        },
      });

      // Upsert UsageTracking (Stripe billing integration ready — stripe_invoice_id = null for now)
      await prisma.usageTracking.upsert({
        where: {
          id: `${installation.id}-${month}`, // deterministic: will not exist yet
        },
        create: {
          installationId: installation.id,
          billingMonth: month,
          recoveredAmount,
          feeOwed,
          feePaid: false,
          stripeInvoiceId: null,
        },
        update: {
          recoveredAmount,
          feeOwed,
        },
      }).catch(async () => {
        // Fallback: find existing and update
        const existing = await prisma.usageTracking.findFirst({
          where: { installationId: installation.id, billingMonth: month },
        });
        if (existing) {
          await prisma.usageTracking.update({
            where: { id: existing.id },
            data: { recoveredAmount, feeOwed },
          });
        } else {
          await prisma.usageTracking.create({
            data: {
              installationId: installation.id,
              billingMonth: month,
              recoveredAmount,
              feeOwed,
              feePaid: false,
              stripeInvoiceId: null,
            },
          });
        }
      });

      console.log(`💰 [${installation.id}] Month ${month}: recovered $${recoveredAmount.toFixed(2)}, fee owed $${feeOwed.toFixed(2)}`);
      processed++;
    }

    return NextResponse.json({
      success: true,
      processed,
      month,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Outcome fee cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

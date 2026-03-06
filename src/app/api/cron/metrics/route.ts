import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCronSecret } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Nightly metrics cron — runs at 2 AM.
 * Computes recovery rates, card fingerprint compliance stats per installation.
 * Currently logs to console; in production these would write to a metrics_daily table
 * or be sent to your analytics platform.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization")?.replace("Bearer ", "") ?? null);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Starting nightly metrics calculation...");

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const installations = await prisma.installation.findMany({
      select: { id: true, stripeAccountId: true },
    });

    const summaries = [];

    for (const installation of installations) {
      const [allThisMonth, retryLogs] = await Promise.all([
        prisma.failedPayment.findMany({
          where: {
            installationId: installation.id,
            createdAt: { gte: monthStart },
          },
          select: { status: true, amount: true },
        }),
        prisma.retryLog.findMany({
          where: {
            attemptedAt: { gte: thirtyDaysAgo },
            failedPayment: { installationId: installation.id },
          },
          select: { cardFingerprint: true },
        }),
      ]);

      const recovered = allThisMonth.filter((p) => p.status === "recovered");
      const totalRecoveredAmount = recovered.reduce((sum, p) => sum + Number(p.amount), 0);
      const recoveryRate = allThisMonth.length > 0
        ? Math.round((recovered.length / allThisMonth.length) * 1000) / 10
        : 0;

      // Max attempts per card in last 30 days (Visa compliance metric)
      const cardMap = new Map<string, number>();
      retryLogs.forEach((log) => {
        if (log.cardFingerprint) {
          cardMap.set(log.cardFingerprint, (cardMap.get(log.cardFingerprint) ?? 0) + 1);
        }
      });
      const maxCardAttempts = Math.max(...Array.from(cardMap.values()), 0);

      const summary = {
        installationId: installation.id,
        month: monthStart.toISOString().slice(0, 7),
        recoveredThisMonth: totalRecoveredAmount,
        totalPayments: allThisMonth.length,
        recoveryRate,
        maxCardAttempts30d: maxCardAttempts,
        visaRiskLevel: maxCardAttempts >= 13 ? "red" : maxCardAttempts >= 9 ? "yellow" : "green",
      };

      summaries.push(summary);

      // Persist to metrics_daily
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.metricsDaily.upsert({
        where: {
          installationId_date: {
            installationId: installation.id,
            date: today,
          },
        },
        create: {
          installationId: installation.id,
          date: today,
          recoveredTotal: totalRecoveredAmount,
          failedTotal: allThisMonth.length,
          recoveryRate,
          maxCardAttempts30d: maxCardAttempts,
        },
        update: {
          recoveredTotal: totalRecoveredAmount,
          failedTotal: allThisMonth.length,
          recoveryRate,
          maxCardAttempts30d: maxCardAttempts,
        },
      });

      console.log(`📊 [${installation.id}] Recovery: ${recoveryRate}% | Max card attempts: ${maxCardAttempts}/15`);
    }

    return NextResponse.json({
      success: true,
      processed: installations.length,
      summaries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Metrics cron error:", error);
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

import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Churn risk score (0–100) per failed payment.
 *
 * Formula from ROADMAP:
 *   score = (attempt_count/5)*0.3
 *         + (max(0, days_since_first_fail - 7) / 21) * 0.3
 *         + (decline_code in hard-stop set ? 0.2 : 0)
 *         + (no email engagement signal ? 0.2 : 0)
 *
 * Score > 65 → flagged as at-risk in dashboard.
 * Score > 85 → candidate for 50% discount offer.
 */

const HIGH_RISK_CODES = ["57", "62", "65", "04", "07"];

function calculateScore(
  attemptCount: number,
  createdAt: Date,
  failureCode: string | null
): number {
  const daysSinceFirstFail = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const attemptScore = Math.min(attemptCount / 5, 1) * 0.3;
  const ageScore = (Math.max(0, daysSinceFirstFail - 7) / 21) * 0.3;
  const codeScore = failureCode && HIGH_RISK_CODES.includes(failureCode) ? 0.2 : 0;
  // Email engagement: we don't have open-rate tracking yet, so apply 0.2 for anyone
  // who has been failed for > 3 days without recovery (conservative signal)
  const engagementScore = daysSinceFirstFail > 3 ? 0.2 : 0;

  const raw = attemptScore + ageScore + codeScore + engagementScore;
  return Math.min(100, Math.round(raw * 100));
}

/**
 * Recalculate churn risk scores for all active failed payments.
 * Called by the nightly churn-risk cron.
 */
export async function recalculateAllChurnScores(): Promise<{
  updated: number;
  atRisk: number;
}> {
  const failedPayments = await prisma.failedPayment.findMany({
    where: { status: "failed" },
    select: {
      id: true,
      attemptCount: true,
      createdAt: true,
      failureCode: true,
    },
  });

  let atRisk = 0;

  // Process in batches of 50 to avoid overloading the DB connection
  const batchSize = 50;
  for (let i = 0; i < failedPayments.length; i += batchSize) {
    const batch = failedPayments.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((fp) => {
        const score = calculateScore(fp.attemptCount, fp.createdAt, fp.failureCode);
        if (score > 65) atRisk++;
        return prisma.failedPayment.update({
          where: { id: fp.id },
          data: { churnRiskScore: score },
        });
      })
    );
  }

  return { updated: failedPayments.length, atRisk };
}

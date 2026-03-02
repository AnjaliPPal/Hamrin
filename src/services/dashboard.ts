import "server-only";
import { prisma } from "@/lib/prisma";

export interface DashboardMetrics {
  totalRecovered: number;
  recoveryRate: number;
  preventedAmount: number;
  visaAttempts: number;
  visaLimit: number;
  cardFingerprintsTracked: number;
  atRiskCustomers: Array<{
    email: string;
    riskScore: number;
    lastAttempt: string;
    amount: number;
  }>;
}

/**
 * Get dashboard metrics for an installation
 */
export async function getDashboardMetrics(
  installationId: string
): Promise<DashboardMetrics> {
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  if (!installation) {
    throw new Error("Installation not found");
  }

  // Calculate total recovered
  const recoveredPayments = await prisma.failedPayment.findMany({
    where: {
      installationId,
      status: "recovered",
    },
    select: {
      amount: true,
    },
  });

  const totalRecovered = recoveredPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  // Calculate recovery rate
  const allPayments = await prisma.failedPayment.findMany({
    where: { installationId },
    select: { status: true },
  });

  const totalRecoveredCount = allPayments.filter(
    (p) => p.status === "recovered"
  ).length;
  const recoveryRate =
    allPayments.length > 0
      ? (totalRecoveredCount / allPayments.length) * 100
      : 0;

  // Calculate Visa compliance metrics (card-fingerprint level)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const retryLogs = await prisma.retryLog.findMany({
    where: {
      attemptedAt: {
        gte: thirtyDaysAgo,
      },
      failedPayment: {
        installationId,
      },
    },
    select: {
      cardFingerprint: true,
    },
  });

  // Count unique card fingerprints
  const uniqueCardFingerprints = new Set(
    retryLogs
      .map((log) => log.cardFingerprint)
      .filter((fp): fp is string => fp !== null)
  );

  // Calculate attempts per card (for compliance gauge)
  const cardAttemptsMap = new Map<string, number>();
  retryLogs.forEach((log) => {
    if (log.cardFingerprint) {
      cardAttemptsMap.set(
        log.cardFingerprint,
        (cardAttemptsMap.get(log.cardFingerprint) || 0) + 1
      );
    }
  });

  const maxCardAttempts = Math.max(...Array.from(cardAttemptsMap.values()), 0);
  const visaLimit = 15; // Visa 15/30d limit

  // Get at-risk customers (churn risk score > 65)
  const atRiskPayments = await prisma.failedPayment.findMany({
    where: {
      installationId,
      status: "failed",
      churnRiskScore: {
        gt: 65,
      },
    },
    select: {
      customerEmail: true,
      churnRiskScore: true,
      createdAt: true,
      amount: true,
    },
    orderBy: {
      churnRiskScore: "desc",
    },
    take: 10,
  });

  const atRiskCustomers = atRiskPayments.map((payment) => {
    const daysAgo = Math.floor(
      (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      email: payment.customerEmail,
      riskScore: payment.churnRiskScore,
      lastAttempt: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
      amount: Number(payment.amount),
    };
  });

  // Prevented amount (via Account Updater) - placeholder for now
  // This would require tracking Account Updater events separately
  const preventedAmount = 0;

  return {
    totalRecovered,
    recoveryRate: Math.round(recoveryRate * 10) / 10,
    preventedAmount,
    visaAttempts: maxCardAttempts,
    visaLimit,
    cardFingerprintsTracked: uniqueCardFingerprints.size,
    atRiskCustomers,
  };
}

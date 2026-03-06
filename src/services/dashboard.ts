import "server-only";
import { prisma } from "@/lib/prisma";

const EU_COUNTRIES = ["GB","IE","DE","FR","NL","AT","BE","IT","ES","PT","PL","CZ","GR","HU","RO","SE","FI","DK","BG","HR","SK","LT","SI","LV","EE","CY","LU","MT"];

export interface DashboardMetrics {
  totalRecovered: number;
  recoveryRate: number;
  preventedAmount: number;
  visaAttempts: number;
  visaLimit: number;
  cardFingerprintsTracked: number;
  topAtRiskCards: Array<{ fingerprint: string; attempts: number; riskLevel: "green" | "yellow" | "red" }>;
  atRiskCustomers: Array<{
    id: string;
    email: string;
    riskScore: number;
    lastAttempt: string;
    amount: number;
    discountOfferSentAt: Date | null;
  }>;
  gdpr: {
    retentionDays: number;
    country: string;
    isEU: boolean;
    nextPurgeDate: string;
  };
  thisMonthFee: number | null;
  pricingModel: string;
}

export async function getDashboardMetrics(installationId: string): Promise<DashboardMetrics> {
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  if (!installation) throw new Error("Installation not found");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const month = monthStart.toISOString().slice(0, 7);

  const [recoveredPayments, allPayments, retryLogs, atRiskPayments, thisMonthFee] =
    await Promise.all([
      prisma.failedPayment.findMany({
        where: { installationId, status: "recovered" },
        select: { amount: true },
      }),
      prisma.failedPayment.findMany({
        where: { installationId },
        select: { status: true },
      }),
      prisma.retryLog.findMany({
        where: {
          attemptedAt: { gte: thirtyDaysAgo },
          failedPayment: { installationId },
        },
        select: { cardFingerprint: true },
      }),
      prisma.failedPayment.findMany({
        where: { installationId, status: "failed", churnRiskScore: { gt: 65 } },
        select: { id: true, customerEmail: true, churnRiskScore: true, createdAt: true, amount: true, discountOfferSentAt: true },
        orderBy: { churnRiskScore: "desc" },
        take: 10,
      }),
      installation.pricingModel === "outcome"
        ? prisma.usageTracking.findFirst({
            where: { installationId, billingMonth: month },
            select: { feeOwed: true },
          })
        : Promise.resolve(null),
    ]);

  const totalRecovered = recoveredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRecoveredCount = allPayments.filter((p) => p.status === "recovered").length;
  const recoveryRate = allPayments.length > 0
    ? Math.round((totalRecoveredCount / allPayments.length) * 1000) / 10
    : 0;

  // Card fingerprint compliance stats
  const cardAttemptsMap = new Map<string, number>();
  retryLogs.forEach((log) => {
    if (log.cardFingerprint) {
      cardAttemptsMap.set(log.cardFingerprint, (cardAttemptsMap.get(log.cardFingerprint) ?? 0) + 1);
    }
  });

  const maxCardAttempts = Math.max(...Array.from(cardAttemptsMap.values()), 0);
  const uniqueCards = cardAttemptsMap.size;

  const topAtRiskCards = Array.from(cardAttemptsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([fp, attempts]) => ({
      fingerprint: `***${fp.slice(-4)}`,
      attempts,
      riskLevel: (attempts >= 13 ? "red" : attempts >= 9 ? "yellow" : "green") as "green" | "yellow" | "red",
    }));

  const atRiskCustomers = atRiskPayments.map((payment) => {
    const daysAgo = Math.floor((Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: payment.id,
      email: payment.customerEmail,
      riskScore: payment.churnRiskScore,
      lastAttempt: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
      amount: Number(payment.amount),
      discountOfferSentAt: payment.discountOfferSentAt,
    };
  });

  // GDPR info
  const isEU = EU_COUNTRIES.includes(installation.country.toUpperCase());
  const retentionDays = isEU ? 540 : 90;
  const nextPurge = new Date();
  nextPurge.setDate(nextPurge.getDate() + 1);
  nextPurge.setHours(4, 0, 0, 0);

  return {
    totalRecovered,
    recoveryRate,
    preventedAmount: 0, // populated when Account Updater events are tracked
    visaAttempts: maxCardAttempts,
    visaLimit: 15,
    cardFingerprintsTracked: uniqueCards,
    topAtRiskCards,
    atRiskCustomers,
    gdpr: {
      retentionDays,
      country: installation.country,
      isEU,
      nextPurgeDate: nextPurge.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
    thisMonthFee: thisMonthFee ? Number(thisMonthFee.feeOwed) : null,
    pricingModel: installation.pricingModel,
  };
}

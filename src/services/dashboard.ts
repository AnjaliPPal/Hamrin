import "server-only";
import { prisma } from "@/lib/prisma";

const EU_COUNTRIES = ["GB","IE","DE","FR","NL","AT","BE","IT","ES","PT","PL","CZ","GR","HU","RO","SE","FI","DK","BG","HR","SK","LT","SI","LV","EE","CY","LU","MT"];

export interface RecoveryAttribution {
  card_update: number;
  retry_engine: number;
  auto_updater: number;
  unknown: number;
  total: number;
}

export interface CancelFlowStats {
  totalSessions: number;
  saves: number;
  cancellations: number;
  saveRate: number;
  savedRevenue: number;
  topReasons: Array<{ reason: string; count: number }>;
  offerAcceptance: { discount: number; pause: number };
}

export interface ReactivationStats {
  totalChurned: number;
  emailsSent: number;
  reactivated: number;
  reactivationRate: number;
  reactivatedFromEmail: number;
}

export interface FailedPaymentRow {
  id: string;
  customerEmail: string;
  amount: number;
  status: string;
  failureCode: string | null;
  attemptCount: number;
  recoverySource: string | null;
  createdAt: Date;
  discountOfferSentAt: Date | null;
  churnRiskScore: number;
}

export interface DashboardMetrics {
  // Payment recovery
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
  failedPaymentsTable: FailedPaymentRow[];
  gdpr: { retentionDays: number; country: string; isEU: boolean; nextPurgeDate: string };
  thisMonthFee: number | null;
  pricingModel: string;
  recoveryAttribution: RecoveryAttribution;
  // Cancel flow (Module 3)
  cancelFlow: CancelFlowStats;
  // Reactivation (Module 6)
  reactivation: ReactivationStats;
  // Totals KPI row
  totalRetainedRevenue: number;
}

export async function getDashboardMetrics(installationId: string): Promise<DashboardMetrics> {
  const installation = await prisma.installation.findUnique({ where: { id: installationId } });
  if (!installation) throw new Error("Installation not found");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const month = monthStart.toISOString().slice(0, 7);

  const [
    recoveredPayments,
    allPayments,
    retryLogs,
    atRiskPayments,
    thisMonthFee,
    attributionGroups,
    failedPaymentsRaw,
    cancelSessions,
    churnedCustomers,
    reactivationEmailsSent,
  ] = await Promise.all([
    prisma.failedPayment.findMany({
      where: { installationId, status: "recovered" },
      select: { amount: true },
    }),
    prisma.failedPayment.findMany({
      where: { installationId },
      select: { status: true },
    }),
    prisma.retryLog.findMany({
      where: { attemptedAt: { gte: thirtyDaysAgo }, failedPayment: { installationId } },
      select: { cardFingerprint: true },
    }),
    prisma.failedPayment.findMany({
      where: { installationId, status: "failed", churnRiskScore: { gt: 65 } },
      select: { id: true, customerEmail: true, churnRiskScore: true, createdAt: true, amount: true, discountOfferSentAt: true },
      orderBy: { churnRiskScore: "desc" },
      take: 10,
    }),
    installation.pricingModel === "outcome"
      ? prisma.usageTracking.findFirst({ where: { installationId, billingMonth: month }, select: { feeOwed: true } })
      : Promise.resolve(null),
    prisma.failedPayment.groupBy({
      by: ["recoverySource"],
      where: { installationId, status: "recovered" },
      _count: { id: true },
    }),
    // Failed payments table — last 50 for display
    prisma.failedPayment.findMany({
      where: { installationId },
      select: {
        id: true, customerEmail: true, amount: true, status: true, failureCode: true,
        attemptCount: true, recoverySource: true, createdAt: true,
        discountOfferSentAt: true, churnRiskScore: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Cancel flow sessions
    prisma.cancelFlowSession.findMany({
      where: { installationId },
      select: {
        savedAt: true, cancelledAt: true, reason: true,
        offerType: true, offerAccepted: true, offerSnapshot: true,
      },
    }),
    // Churned customers
    prisma.churnedCustomer.findMany({
      where: { installationId },
      select: { reactivatedAt: true, reactivationSource: true },
    }),
    // Reactivation emails sent count
    prisma.reactivationEmail.count({
      where: { churnedCustomer: { installationId } },
    }),
  ]);

  // ── Payment recovery metrics ──
  const totalRecovered = recoveredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRecoveredCount = allPayments.filter((p) => p.status === "recovered").length;
  const recoveryRate = allPayments.length > 0
    ? Math.round((totalRecoveredCount / allPayments.length) * 1000) / 10
    : 0;

  const cardAttemptsMap = new Map<string, number>();
  retryLogs.forEach((log) => {
    if (log.cardFingerprint) {
      cardAttemptsMap.set(log.cardFingerprint, (cardAttemptsMap.get(log.cardFingerprint) ?? 0) + 1);
    }
  });
  const maxCardAttempts = Math.max(...Array.from(cardAttemptsMap.values()), 0);
  const topAtRiskCards = Array.from(cardAttemptsMap.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
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

  const attributionMap: Record<string, number> = {};
  attributionGroups.forEach((g) => { attributionMap[g.recoverySource ?? "unknown"] = g._count.id; });
  const recoveryAttribution: RecoveryAttribution = {
    card_update: attributionMap["card_update"] ?? 0,
    retry_engine: attributionMap["retry_engine"] ?? 0,
    auto_updater: attributionMap["auto_updater"] ?? 0,
    unknown: attributionMap["unknown"] ?? 0,
    total: totalRecoveredCount,
  };

  const failedPaymentsTable: FailedPaymentRow[] = failedPaymentsRaw.map((p) => ({
    id: p.id,
    customerEmail: p.customerEmail,
    amount: Number(p.amount),
    status: p.status,
    failureCode: p.failureCode,
    attemptCount: p.attemptCount,
    recoverySource: p.recoverySource,
    createdAt: p.createdAt,
    discountOfferSentAt: p.discountOfferSentAt,
    churnRiskScore: p.churnRiskScore,
  }));

  // ── Cancel flow stats ──
  const saves = cancelSessions.filter((s) => s.savedAt != null).length;
  const cancellations = cancelSessions.filter((s) => s.cancelledAt != null).length;
  const saveRate = cancelSessions.length > 0 ? Math.round((saves / cancelSessions.length) * 100) : 0;

  const reasonCounts: Record<string, number> = {};
  cancelSessions.forEach((s) => {
    if (s.reason) reasonCounts[s.reason] = (reasonCounts[s.reason] ?? 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const discountAccepted = cancelSessions.filter((s) => s.offerAccepted && s.offerType === "discount").length;
  const pauseAccepted = cancelSessions.filter((s) => s.offerAccepted && s.offerType === "pause").length;

  const cancelFlow: CancelFlowStats = {
    totalSessions: cancelSessions.length,
    saves,
    cancellations,
    saveRate,
    savedRevenue: 0, // would need subscription amount — deferred to Module 7 v2
    topReasons,
    offerAcceptance: { discount: discountAccepted, pause: pauseAccepted },
  };

  // ── Reactivation stats ──
  const reactivated = churnedCustomers.filter((c) => c.reactivatedAt != null).length;
  const reactivationRate = churnedCustomers.length > 0
    ? Math.round((reactivated / churnedCustomers.length) * 100)
    : 0;
  const reactivatedFromEmail = churnedCustomers.filter(
    (c) => c.reactivationSource === "reactivation_email"
  ).length;

  const reactivation: ReactivationStats = {
    totalChurned: churnedCustomers.length,
    emailsSent: reactivationEmailsSent,
    reactivated,
    reactivationRate,
    reactivatedFromEmail,
  };

  // ── GDPR ──
  const isEU = EU_COUNTRIES.includes(installation.country.toUpperCase());
  const nextPurge = new Date();
  nextPurge.setDate(nextPurge.getDate() + 1);
  nextPurge.setHours(4, 0, 0, 0);

  const totalRetainedRevenue = totalRecovered; // will grow as cancel flow savedRevenue is tracked

  return {
    totalRecovered,
    recoveryRate,
    preventedAmount: 0,
    visaAttempts: maxCardAttempts,
    visaLimit: 15,
    cardFingerprintsTracked: cardAttemptsMap.size,
    topAtRiskCards,
    atRiskCustomers,
    failedPaymentsTable,
    gdpr: {
      retentionDays: isEU ? 540 : 90,
      country: installation.country,
      isEU,
      nextPurgeDate: nextPurge.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
    thisMonthFee: thisMonthFee ? Number(thisMonthFee.feeOwed) : null,
    pricingModel: installation.pricingModel,
    recoveryAttribution,
    cancelFlow,
    reactivation,
    totalRetainedRevenue,
  };
}

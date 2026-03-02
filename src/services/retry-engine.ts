import "server-only";
import { prisma } from '@/lib/prisma';
import { createConnectedStripeClient } from '@/lib/stripe';

/**
 * Hard decline codes that should not be retried
 */
const DO_NOT_RETRY_CODES = ['03', '04', '07', '12', '57', '62'];

/**
 * Calculate next retry time based on failure code and attempt count
 */
function calculateNextRetryAt(
  failureCode: string | null,
  attemptCount: number
): Date {
  const now = new Date();
  const nextRetry = new Date(now);

  if (!failureCode || failureCode === 'unknown') {
    // Generic retry schedule: 6h, 24h, 72h, 168h
    const intervals = [6, 24, 72, 168]; // hours
    const interval = intervals[Math.min(attemptCount, intervals.length - 1)];
    nextRetry.setHours(now.getHours() + interval);
  } else if (failureCode === 'expired_card') {
    // Expired card: 2h, 48h
    const intervals = [2, 48]; // hours
    const interval = intervals[Math.min(attemptCount, intervals.length - 1)];
    nextRetry.setHours(now.getHours() + interval);
  } else if (failureCode === 'insufficient_funds') {
    // Insufficient funds: 3d, 5d, 7d
    const intervals = [3, 5, 7]; // days
    const interval = intervals[Math.min(attemptCount, intervals.length - 1)];
    nextRetry.setDate(now.getDate() + interval);
  } else {
    // Default: 6h, 24h, 72h, 168h
    const intervals = [6, 24, 72, 168];
    const interval = intervals[Math.min(attemptCount, intervals.length - 1)];
    nextRetry.setHours(now.getHours() + interval);
  }

  return nextRetry;
}

/**
 * Check Visa compliance: 15 attempts per card per 30 days
 */
async function checkVisaCompliance(cardFingerprint: string | null): Promise<boolean> {
  if (!cardFingerprint) return true; // No fingerprint = can't track, allow retry

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cardAttempts = await prisma.retryLog.count({
    where: {
      cardFingerprint,
      attemptedAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  return cardAttempts < 15; // Visa limit: 15 attempts per 30 days
}

/**
 * Process a single failed payment retry
 */
export async function processRetry(failedPaymentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const failedPayment = await prisma.failedPayment.findUnique({
    where: { id: failedPaymentId },
    include: {
      installation: true,
    },
  });

  if (!failedPayment) {
    return { success: false, error: 'Failed payment not found' };
  }

  // Check guards
  if (failedPayment.attemptCount >= 5) {
    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: { status: 'abandoned' },
    });
    return { success: false, error: 'Max attempts reached' };
  }

  if (failedPayment.failureCode && DO_NOT_RETRY_CODES.includes(failedPayment.failureCode)) {
    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: { status: 'abandoned' },
    });
    return { success: false, error: 'Do not retry code' };
  }

  if (failedPayment.retryWindowEnd && failedPayment.retryWindowEnd < new Date()) {
    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: { status: 'abandoned' },
    });
    return { success: false, error: 'Retry window expired' };
  }

  // Check Visa compliance at card level
  const visaCompliant = await checkVisaCompliance(failedPayment.cardFingerprint);
  if (!visaCompliant) {
    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: { status: 'abandoned' },
    });
    return { success: false, error: 'Visa 15/30d limit reached for this card' };
  }

  // Attempt retry
  try {
    const stripeClient = createConnectedStripeClient(failedPayment.installation.accessToken);
    
    if (!failedPayment.invoiceId) {
      return { success: false, error: 'No invoice ID' };
    }

    const invoice = await stripeClient.invoices.retrieve(failedPayment.invoiceId);
    const retriedInvoice = await stripeClient.invoices.pay(invoice.id);

    const success = retriedInvoice.status === 'paid';
    const attemptNumber = failedPayment.attemptCount + 1;

    // Log retry attempt
    await prisma.retryLog.create({
      data: {
        failedPaymentId,
        cardFingerprint: failedPayment.cardFingerprint,
        attemptNumber,
        success,
        error: success ? null : retriedInvoice.last_finalization_error?.message || 'Unknown error',
      },
    });

    if (success) {
      // Mark as recovered
      await prisma.failedPayment.update({
        where: { id: failedPaymentId },
        data: {
          status: 'recovered',
          attemptCount: attemptNumber,
        },
      });

      // Update recovered monthly metrics
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      await prisma.recoveredMonthly.upsert({
        where: {
          installationId_month: {
            installationId: failedPayment.installationId,
            month,
          },
        },
        create: {
          installationId: failedPayment.installationId,
          month,
          recoveredAmount: failedPayment.amount,
          customerCount: 1,
        },
        update: {
          recoveredAmount: {
            increment: failedPayment.amount,
          },
          customerCount: {
            increment: 1,
          },
        },
      });

      // If outcome pricing, calculate fee (will be done in separate cron)
      // TODO: Queue outcome fee calculation job

      return { success: true };
    } else {
      // Update failed payment with next retry time
      const nextRetryAt = calculateNextRetryAt(
        failedPayment.failureCode,
        attemptNumber
      );

      await prisma.failedPayment.update({
        where: { id: failedPaymentId },
        data: {
          attemptCount: attemptNumber,
          nextRetryAt,
        },
      });

      return {
        success: false,
        error: retriedInvoice.last_finalization_error?.message || 'Payment failed',
      };
    }
  } catch (error) {
    const attemptNumber = failedPayment.attemptCount + 1;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed retry attempt
    await prisma.retryLog.create({
      data: {
        failedPaymentId,
        cardFingerprint: failedPayment.cardFingerprint,
        attemptNumber,
        success: false,
        error: errorMessage,
      },
    });

    // Update next retry time
    const nextRetryAt = calculateNextRetryAt(
      failedPayment.failureCode,
      attemptNumber
    );

    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: {
        attemptCount: attemptNumber,
        nextRetryAt,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Process all failed payments ready for retry
 */
export async function processRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  
  const failedPayments = await prisma.failedPayment.findMany({
    where: {
      status: 'failed',
      nextRetryAt: {
        lte: now,
      },
    },
    take: 100, // Process in batches
  });

  let succeeded = 0;
  let failed = 0;

  for (const payment of failedPayments) {
    const result = await processRetry(payment.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    processed: failedPayments.length,
    succeeded,
    failed,
  };
}

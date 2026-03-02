import "server-only";
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { stripeAdmin } from '@/lib/stripe';
import { env } from '@/lib/env';

export const runtime = "nodejs";

// EU countries for GDPR retention (540 days)
const EU_COUNTRIES = ['GB', 'IE', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'PT', 'PL', 'CZ', 'GR', 'HU', 'RO', 'SE', 'FI', 'DK', 'BG', 'HR', 'SK', 'LT', 'SI', 'LV', 'EE', 'CY', 'LU', 'MT'];

/**
 * For Stripe Connect webhooks, the connected account ID lives on event.account.
 * The individual resource objects (Invoice, PaymentMethod, etc.) do NOT carry it.
 */
async function getInstallationId(stripeAccountId: string): Promise<string | null> {
  const installation = await prisma.installation.findUnique({
    where: { stripeAccountId },
    select: { id: true },
  });
  return installation?.id ?? null;
}

function getRetentionDays(country: string): number {
  return EU_COUNTRIES.includes(country.toUpperCase()) ? 540 : 90;
}

async function extractCardFingerprint(
  chargeId: string | Stripe.Charge | null | undefined
): Promise<string | null> {
  if (!chargeId) return null;
  try {
    const charge = typeof chargeId === 'string'
      ? await stripeAdmin.charges.retrieve(chargeId)
      : chargeId;
    if (charge.payment_method_details?.type === 'card') {
      return charge.payment_method_details.card?.fingerprint ?? null;
    }
  } catch (error) {
    console.error('Failed to extract card fingerprint:', error);
  }
  return null;
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET === 'whsec_XXXX') {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured. See SETUP_GUIDE.md');
    return Response.json(
      { error: 'Webhook secret not configured. Add STRIPE_WEBHOOK_SECRET to .env' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeAdmin.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', msg);
    return Response.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    // For Connect webhooks, the connected account ID is on event.account (not on the payload object)
    const stripeAccountId = event.account
      ?? (event.data.object as { metadata?: { stripe_account_id?: string } }).metadata?.stripe_account_id;

    let installationId: string | null = null;
    let retentionDays = 90;

    if (stripeAccountId) {
      installationId = await getInstallationId(stripeAccountId);
      if (installationId) {
        const installation = await prisma.installation.findUnique({
          where: { id: installationId },
          select: { country: true },
        });
        if (installation) {
          retentionDays = getRetentionDays(installation.country);
        }
      }
    }

    await prisma.eventRaw.upsert({
      where: { stripeEventId: event.id },
      create: {
        installationId: installationId ?? 'unknown',
        stripeEventId: event.id,
        eventType: event.type,
        rawJson: event.data.object as unknown as Prisma.InputJsonValue,
        retentionDays,
      },
      update: {
        rawJson: event.data.object as unknown as Prisma.InputJsonValue,
        retentionDays,
      },
    });

    switch (event.type) {
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // event.account = connected account ID (Connect); fall back to metadata if set
        const accountId = event.account ?? invoice.metadata?.stripe_account_id;

        if (!accountId) {
          console.warn('⚠️ No stripe account found for invoice:', invoice.id);
          break;
        }

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) {
          console.warn('⚠️ Installation not found for account:', accountId);
          break;
        }

        let failureCode = 'unknown';
        let cardFingerprint: string | null = null;

        const chargeId = (invoice as Stripe.Invoice & { charge?: string | Stripe.Charge }).charge;
        if (chargeId) {
          const charge = typeof chargeId === 'string'
            ? await stripeAdmin.charges.retrieve(chargeId)
            : chargeId;
          failureCode = charge.failure_code ?? 'unknown';
          cardFingerprint = await extractCardFingerprint(charge);
        }

        const retryWindowEnd = new Date();
        retryWindowEnd.setDate(retryWindowEnd.getDate() + 30);

        const nextRetryAt = new Date();
        nextRetryAt.setHours(nextRetryAt.getHours() + 6);

        await prisma.failedPayment.create({
          data: {
            installationId: resolvedInstallationId,
            customerEmail: invoice.customer_email ?? 'unknown@example.com',
            amount: invoice.amount_due / 100,
            failureCode,
            cardFingerprint,
            status: 'failed',
            attemptCount: 0,
            retryWindowEnd,
            nextRetryAt,
            invoiceId: invoice.id,
          },
        });

        console.log('✅ Created failed_payment record for invoice:', invoice.id);

        const updateCardLink = `${env.NEXT_PUBLIC_APP_URL}/recover?invoice_id=${invoice.id}`;
        import('@/services/email').then(({ sendPaymentFailedEmail }) => {
          sendPaymentFailedEmail(invoice.customer_email ?? '', {
            amount: invoice.amount_due / 100,
            failureReason: failureCode === 'unknown' ? 'Payment declined' : `Error: ${failureCode}`,
            updateCardLink,
          }).catch(err => console.error('Failed to send email:', err));
        });
        break;
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;
        const accountId = event.account ?? invoice.metadata?.stripe_account_id;
        if (!accountId) break;

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) break;

        console.log('📅 Invoice upcoming for installation:', resolvedInstallationId, '| invoice:', invoice.id);
        // TODO: Extract card expiry from invoice and queue pre-dunning email
        break;
      }

      case 'payment_method.automatically_updated': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        // For Connect, account is on event.account
        const accountId = event.account;
        if (!accountId) break;

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) break;

        if (paymentMethod.type === 'card' && paymentMethod.card?.fingerprint) {
          const cardFingerprint = paymentMethod.card.fingerprint;

          await prisma.failedPayment.updateMany({
            where: { installationId: resolvedInstallationId, cardFingerprint, status: 'failed' },
            data: { status: 'recovered' },
          });

          console.log('✅ Marked payments as recovered for card:', cardFingerprint);

          const recoveredPayments = await prisma.failedPayment.findMany({
            where: { installationId: resolvedInstallationId, cardFingerprint, status: 'recovered' },
            select: { customerEmail: true, amount: true },
          });

          import('@/services/email').then(({ sendRecoverySuccessEmail }) => {
            recoveredPayments.forEach(payment => {
              sendRecoverySuccessEmail(payment.customerEmail, {
                amount: Number(payment.amount),
              }).catch(err => console.error('Failed to send recovery email:', err));
            });
          });
        }
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return Response.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

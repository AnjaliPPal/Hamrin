import "server-only";
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { stripeAdmin, createConnectedStripeClient } from '@/lib/stripe';
import { env } from '@/lib/env';
import { handleUpcomingInvoice } from '@/services/pre-dunning';

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

        // Idempotency: skip if we already have a record for this invoice
        const existing = invoice.id
          ? await prisma.failedPayment.findFirst({ where: { invoiceId: invoice.id }, select: { id: true, failedEmailSentAt: true } })
          : null;

        let failedPaymentId: string;
        if (existing) {
          failedPaymentId = existing.id;
          console.log('⚠️ Duplicate invoice.payment_failed for invoice:', invoice.id, '— skipping create');
        } else {
          const created = await prisma.failedPayment.create({
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
          failedPaymentId = created.id;
          console.log('✅ Created failed_payment record for invoice:', invoice.id);
        }

        // Email idempotency: only send if we haven't sent already
        const alreadyEmailed = existing?.failedEmailSentAt != null;
        if (!alreadyEmailed && invoice.customer_email) {
          const updateCardLink = `${env.NEXT_PUBLIC_APP_URL}/recover?invoice_id=${invoice.id}`;
          const fpId = failedPaymentId;
          import('@/services/email').then(({ sendPaymentFailedEmail }) => {
            sendPaymentFailedEmail(invoice.customer_email ?? '', {
              amount: invoice.amount_due / 100,
              failureReason: failureCode === 'unknown' ? 'Payment declined' : `Error: ${failureCode}`,
              updateCardLink,
            })
              .then((result) => {
                if (result.success) {
                  return prisma.failedPayment.update({
                    where: { id: fpId },
                    data: { failedEmailSentAt: new Date() },
                  });
                }
              })
              .catch(err => console.error('Failed to send failed-payment email:', err));
          });
        }
        break;
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;
        const accountId = event.account ?? invoice.metadata?.stripe_account_id;
        if (!accountId) break;

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) break;

        // Get the connected account's Stripe client to retrieve their customer's payment method
        const connectedInstallation = await prisma.installation.findUnique({
          where: { id: resolvedInstallationId },
          select: { accessToken: true },
        });
        if (!connectedInstallation) break;

        const connectedClient = createConnectedStripeClient(connectedInstallation.accessToken);

        // Fire and forget — don't hold up the webhook response
        handleUpcomingInvoice(invoice, connectedClient, resolvedInstallationId)
          .catch(err => console.error('❌ Pre-dunning handler error:', err));

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

          const now = new Date();
          await prisma.failedPayment.updateMany({
            where: { installationId: resolvedInstallationId, cardFingerprint, status: 'failed' },
            data: { status: 'recovered', recoveredAt: now, recoverySource: 'auto_updater' },
          });

          console.log('✅ Marked payments as recovered (auto_updater) for card:', cardFingerprint);

          const recoveredPayments = await prisma.failedPayment.findMany({
            where: { installationId: resolvedInstallationId, cardFingerprint, recoverySource: 'auto_updater', recoveredAt: now },
            select: { id: true, customerEmail: true, amount: true, recoveryEmailSentAt: true },
          });

          import('@/services/email').then(({ sendRecoverySuccessEmail }) => {
            recoveredPayments.forEach(payment => {
              if (payment.recoveryEmailSentAt) return;
              sendRecoverySuccessEmail(payment.customerEmail, {
                amount: Number(payment.amount),
              })
                .then((result) => {
                  if (result.success) {
                    return prisma.failedPayment.update({
                      where: { id: payment.id },
                      data: { recoveryEmailSentAt: new Date() },
                    });
                  }
                })
                .catch(err => console.error('Failed to send recovery email:', err));
            });
          });
        }
        break;
      }

      /**
       * Module 4: Pause subscription flow.
       * Sync pause/resume state to PausedSubscription for Pause Wall and analytics.
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = event.account;
        if (!accountId) break;

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) break;

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;
        if (!customerId) break;

        const subId = subscription.id;
        const pauseCollection = subscription.pause_collection ?? null;

        try {
          if (pauseCollection?.resumes_at) {
            // Subscription is paused — upsert PausedSubscription
            const resumeAt = new Date(pauseCollection.resumes_at * 1000);
            const now = new Date();
            await prisma.pausedSubscription.upsert({
              where: { stripeSubscriptionId: subId },
              create: {
                installationId: resolvedInstallationId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subId,
                pausedAt: now,
                resumeAt,
                pauseSource: 'manual',
              },
              update: {
                pausedAt: now,
                resumeAt,
                resumedAt: null,
              },
            });
            console.log('✅ PausedSubscription synced (paused):', subId);
          } else {
            // Subscription not paused — if we have a record, mark as resumed
            const existing = await prisma.pausedSubscription.findUnique({
              where: { stripeSubscriptionId: subId },
              select: { id: true },
            });
            if (existing) {
              await prisma.pausedSubscription.update({
                where: { stripeSubscriptionId: subId },
                data: { resumedAt: new Date() },
              });
              console.log('✅ PausedSubscription synced (resumed):', subId);
            }
          }
        } catch (err) {
          console.error('⚠️ PausedSubscription sync error:', err);
        }
        break;
      }

      /**
       * Module 6: Reactivation Campaigns.
       * When a subscription is deleted (cancelled), create a ChurnedCustomer record
       * so the daily reactivation cron can send win-back emails.
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = event.account;
        if (!accountId) break;

        const resolvedInstallationId = await getInstallationId(accountId);
        if (!resolvedInstallationId) break;

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;
        if (!customerId) break;

        // Fetch customer email from Stripe (not always on the subscription object)
        let customerEmail = '';
        try {
          const customer = await stripeAdmin.customers.retrieve(customerId, {
            stripeAccount: accountId,
          });
          if (!customer.deleted) {
            customerEmail = customer.email ?? '';
          }
        } catch (err) {
          console.error('⚠️ Could not fetch customer for reactivation:', err);
        }

        if (!customerEmail) {
          console.warn('⚠️ No customer email — skipping ChurnedCustomer for subscription:', subscription.id);
          break;
        }

        // Pull cancel reason from the latest CancelFlowSession if one exists
        const lastSession = await prisma.cancelFlowSession.findFirst({
          where: { installationId: resolvedInstallationId, stripeCustomerId: customerId },
          orderBy: { createdAt: 'desc' },
          select: { reason: true },
        });

        // Idempotency: only create if not already recorded
        const existingChurned = await prisma.churnedCustomer.findFirst({
          where: { installationId: resolvedInstallationId, stripeCustomerId: customerId },
          select: { id: true },
        });

        if (!existingChurned) {
          await prisma.churnedCustomer.create({
            data: {
              installationId: resolvedInstallationId,
              stripeCustomerId: customerId,
              customerEmail,
              cancelledAt: new Date(),
              cancelReason: lastSession?.reason ?? null,
            },
          });
          console.log('✅ ChurnedCustomer created for:', customerEmail);
        }
        break;
      }

      /**
       * LTD purchase — transaction-safe global inventory (50 spots).
       * Fires when a customer completes the $749 one-time Payment Link.
       * Platform payments: event.account is null. Metadata plan=ltd set on Payment Link.
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only handle LTD (metadata on Payment Link) or mode=payment for our LTD price
        const isLtd = session.metadata?.plan === 'ltd' || session.metadata?.product === 'ltd';
        if (!isLtd) break;

        const customerEmail = session.customer_details?.email;
        if (!customerEmail) {
          console.warn('⚠️ LTD purchase missing customer email, session:', session.id);
          break;
        }

        const PLATFORM_LTD_ID = 'platform_ltd';

        try {
          await prisma.$transaction(async (tx) => {
            const installation = await tx.installation.upsert({
              where: { stripeAccountId: PLATFORM_LTD_ID },
              create: {
                stripeAccountId: PLATFORM_LTD_ID,
                accessToken: 'platform',
                country: 'US',
                pricingModel: 'ltd',
              },
              update: {},
            });

            const inv = await tx.ltdInventory.findUnique({
              where: { installationId: installation.id },
            });

            if (inv) {
              if (inv.ltdSold >= inv.maxCapacity) throw new Error('LTD_SOLD_OUT');
              await tx.ltdInventory.update({
                where: { installationId: installation.id },
                data: { ltdSold: { increment: 1 } },
              });
            } else {
              await tx.ltdInventory.create({
                data: {
                  installationId: installation.id,
                  ltdSold: 1,
                  maxCapacity: 50,
                },
              });
            }
          });

          console.log('✅ LTD purchase recorded for:', customerEmail);

          import('@/services/email').then(({ sendRecoverySuccessEmail }) => {
            sendRecoverySuccessEmail(customerEmail, { amount: 749, customerName: customerEmail }).catch(
              (err) => console.error('Failed to send LTD welcome email:', err)
            );
          });
        } catch (err) {
          if (err instanceof Error && err.message === 'LTD_SOLD_OUT') {
            console.warn('⚠️ LTD sold out — rejecting purchase for:', customerEmail);
          } else {
            console.error('❌ LTD purchase processing error:', err);
          }
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

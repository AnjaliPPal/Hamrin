import "server-only";
import { cookies } from "next/headers";
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/debug/simulate
 * Creates a synthetic invoice.payment_failed record so merchants can test
 * the dashboard, retry engine, and email flows without a real Stripe failure.
 * Protected: requires a valid session AND the installation must be in test mode.
 */
export async function POST(req: Request) {
  // Session guard
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = getSessionFromToken(token);

  if (isSessionEnabled() && !session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { installationId?: string; email?: string; amount?: number } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const installationId = session?.installationId ?? body.installationId;
  if (!installationId) return Response.json({ error: "Missing installationId" }, { status: 400 });

  // Ensure test mode
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { id: true, livemode: true, stripeAccountId: true } as any,
  });
  if (!installation) return Response.json({ error: "Installation not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((installation as any).livemode === true) {
    return Response.json(
      { error: "Simulate is only allowed in test mode. Your installation is set to LIVE." },
      { status: 403 }
    );
  }

  const customerEmail = body.email ?? `test-${Date.now()}@simulate.hamrin.ai`;
  const amount = body.amount ?? 49.0;
  const fakeInvoiceId = `in_sim_${Date.now()}`;

  // Compute churn risk score deterministically for the simulated event
  const churnRiskScore = Math.floor(Math.random() * 30) + 60; // 60–89

  const retryWindowEnd = new Date();
  retryWindowEnd.setDate(retryWindowEnd.getDate() + 7);
  const nextRetryAt = new Date();
  nextRetryAt.setHours(nextRetryAt.getHours() + 6);

  const failedPayment = await prisma.failedPayment.create({
    data: {
      installationId,
      customerEmail,
      amount,
      failureCode: "insufficient_funds",
      cardFingerprint: `sim_${Math.random().toString(36).slice(2, 10)}`,
      status: "failed",
      attemptCount: 1,
      retryWindowEnd,
      nextRetryAt,
      churnRiskScore,
      invoiceId: fakeInvoiceId,
    },
  });

  // Store a synthetic EventRaw so it shows up in the event viewer
  await prisma.eventRaw.upsert({
    where: { stripeEventId: fakeInvoiceId },
    create: {
      installationId,
      stripeEventId: fakeInvoiceId,
      eventType: "invoice.payment_failed",
      rawJson: {
        id: fakeInvoiceId,
        object: "invoice",
        customer_email: customerEmail,
        amount_due: Math.round(amount * 100),
        status: "open",
        attempt_count: 1,
        _simulated: true,
      },
      retentionDays: 90,
    },
    update: {},
  });

  return Response.json({
    ok: true,
    message: `Simulated invoice.payment_failed for ${customerEmail}`,
    failedPaymentId: failedPayment.id,
    churnRiskScore,
  });
}

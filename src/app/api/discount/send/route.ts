import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscountEmail } from "@/services/email";
import { env } from "@/lib/env";
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const failedPaymentId = body.failedPaymentId as string | undefined;

    if (!failedPaymentId) {
      return NextResponse.json(
        { error: "Missing failedPaymentId" },
        { status: 400 }
      );
    }

    let installationId: string;
    if (isSessionEnabled()) {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = getSessionFromToken(token);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      installationId = session.installationId;
    } else {
      const id = body.installationId as string | undefined;
      if (!id) {
        return NextResponse.json(
          { error: "Missing installationId" },
          { status: 400 }
        );
      }
      installationId = id;
    }

    const payment = await prisma.failedPayment.findFirst({
      where: { id: failedPaymentId, installationId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found or access denied" },
        { status: 404 }
      );
    }

    if (payment.discountOfferSentAt) {
      return NextResponse.json(
        { error: "Discount offer already sent", sentAt: payment.discountOfferSentAt },
        { status: 400 }
      );
    }

    const updateCardLink = payment.invoiceId
      ? `${env.NEXT_PUBLIC_APP_URL}/recover?invoice_id=${payment.invoiceId}`
      : `${env.NEXT_PUBLIC_APP_URL}/recover`;

    const result = await sendDiscountEmail(payment.customerEmail, {
      amount: Number(payment.amount),
      updateCardLink,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send email" },
        { status: 500 }
      );
    }

    await prisma.failedPayment.update({
      where: { id: failedPaymentId },
      data: { discountOfferSentAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Offer sent" });
  } catch (error) {
    console.error("❌ Discount send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

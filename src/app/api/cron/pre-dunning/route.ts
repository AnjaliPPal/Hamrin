import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { sendPreDunningEmail } from "@/services/email";
import type { PreDunningJobPayload } from "@/services/pre-dunning";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Receives delayed pre-dunning jobs from QStash.
 * Sends T-7 or T-1 card expiry warning emails.
 *
 * In production: QStash signs requests — verifySignatureAppRouter validates them.
 * In dev (no QSTASH signing keys): accepts unauthenticated POSTs for testing.
 */
async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PreDunningJobPayload;

    const { customerEmail, expiryDate, daysUntilExpiry, updateCardLink } = body;

    if (!customerEmail || !expiryDate || daysUntilExpiry === undefined || !updateCardLink) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await sendPreDunningEmail(customerEmail, {
      expiryDate,
      daysUntilExpiry,
      updateCardLink,
    });

    if (!result.success) {
      console.error("❌ Pre-dunning email failed:", result.error);
      return NextResponse.json(
        { error: "Email failed", details: result.error },
        { status: 500 }
      );
    }

    console.log(`✅ Pre-dunning T-${daysUntilExpiry} email sent to ${customerEmail}`);
    return NextResponse.json({ success: true, daysUntilExpiry });
  } catch (err) {
    console.error("❌ Pre-dunning cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Use QStash signature verification in production, raw handler in dev
export const POST = env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY
  ? verifySignatureAppRouter(handler)
  : handler;

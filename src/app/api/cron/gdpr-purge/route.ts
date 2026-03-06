import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCronSecret } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Nightly GDPR/PSD3 auto-purge cron — runs at 3 AM.
 *
 * Deletes events_raw rows where:
 *   created_at < NOW() - retention_days
 *
 * EU installations: 540 days (18 months, GDPR + PSD3 audit trail)
 * US/other: 90 days
 *
 * retention_days is stored on each events_raw row at insert time
 * based on the installation's country (set during Stripe Connect OAuth).
 */
export async function GET(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization")?.replace("Bearer ", "") ?? null);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Starting GDPR/PSD3 auto-purge...");

    const now = new Date();

    // Find all events_raw records that have exceeded their retention window
    // We query by computing the cutoff date per row's own retentionDays value.
    // Prisma doesn't support column arithmetic in WHERE, so we use raw SQL here.
    const result = await prisma.$executeRaw`
      DELETE FROM events_raw
      WHERE deleted_at IS NULL
        AND created_at < (NOW() - INTERVAL '1 day' * retention_days)
    `;

    console.log(`✅ GDPR purge complete: ${result} records deleted`);

    return NextResponse.json({
      success: true,
      deleted: result,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ GDPR purge cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

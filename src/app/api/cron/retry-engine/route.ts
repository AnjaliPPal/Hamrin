import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { processRetries } from "@/services/retry-engine";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Cron job endpoint for retry engine
 * Call this endpoint hourly via Vercel Cron or external cron service
 * 
 * Security: Verify cron secret in production
 */
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (env.NODE_ENV === "production") {
    if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("🔄 Starting retry engine cron job...");
    const result = await processRetries();
    
    console.log(`✅ Retry engine completed: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Retry engine cron error:", error);
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

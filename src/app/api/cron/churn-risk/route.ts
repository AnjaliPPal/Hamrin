import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { recalculateAllChurnScores } from "@/services/churn";
import { assertCronSecret } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization")?.replace("Bearer ", "") ?? null);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Starting churn risk calculation...");
    const result = await recalculateAllChurnScores();
    console.log(`✅ Churn risk updated: ${result.updated} payments, ${result.atRisk} at-risk`);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Churn risk cron error:", error);
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

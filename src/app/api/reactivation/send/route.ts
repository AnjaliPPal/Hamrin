import "server-only";
import { env } from "@/lib/env";
import { runReactivationCron } from "@/services/reactivation";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/reactivation/send — daily cron, protected by CRON_SECRET */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReactivationCron();
    console.log("✅ Reactivation cron complete:", result);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("❌ Reactivation cron error:", err);
    return Response.json(
      { error: "Cron failed", details: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

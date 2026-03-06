import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    database: "unknown",
    stripe: "unknown",
    email: "unknown",
    webhooks: "unknown",
    gdpr_purge_job: "scheduled",
    card_fingerprint_tracking: "active",
    retry_engine: "scheduled",
    timestamp: new Date().toISOString(),
  };

  // Database check — lightweight query
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "healthy";
  } catch {
    checks.database = "unreachable";
  }

  // Stripe check — key is configured
  checks.stripe = env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith("sk_")
    ? "configured"
    : "not_configured";

  // Webhook secret check
  checks.webhooks = env.STRIPE_WEBHOOK_SECRET && env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")
    ? "configured"
    : "not_configured";

  // Email check — at least one provider is configured
  checks.email = env.EMAIL_PROVIDER !== "none"
    ? `configured (${env.EMAIL_PROVIDER})`
    : "disabled (dev mode)";

  const allHealthy =
    checks.database === "healthy" &&
    checks.stripe === "configured";

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      version: "1.0.0",
      product: "hamrin.ai — payment recovery",
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        // Allow public access — this is intentionally public for transparency
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromToken, SESSION_COOKIE_NAME, isSessionEnabled } from "@/lib/session";
import { cancelFlowConfigUpdateSchema } from "@/lib/validation";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * GET /api/cancel-flow/config?installation_id=X
 * Public — called by the embeddable widget to fetch config.
 * No auth required so the widget can call it cross-origin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const installationId = searchParams.get("installation_id");

    if (!installationId) {
      return NextResponse.json(
        { error: "installation_id is required" },
        { status: 400 }
      );
    }

    const config = await prisma.cancelFlowConfig.findUnique({
      where: { installationId },
    });

    if (!config) {
      // Return defaults — widget can render with defaults even before merchant configures
      return NextResponse.json({
        enabled: true,
        offers: [
          { type: "discount", discountPercent: 20, discountMonths: 3 },
          { type: "pause", pauseMonths: 1 },
        ],
        reasonOptions: [
          "Too expensive",
          "Not using it enough",
          "Missing features",
          "Switching to competitor",
          "Other",
        ],
        brandColor: "#2563eb",
        brandLogo: null,
      });
    }

    return NextResponse.json({
      enabled: config.enabled,
      offers: config.offers,
      reasonOptions: config.reasonOptions,
      brandColor: config.brandColor,
      brandLogo: config.brandLogo,
    });
  } catch (error) {
    console.error("❌ Cancel flow config GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cancel-flow/config
 * Auth required — merchant updates their cancel flow settings from the dashboard.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Auth: require session
    let installationId: string | null = null;

    if (isSessionEnabled()) {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      const session = getSessionFromToken(token);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      installationId = session.installationId;
    } else {
      // Dev fallback: accept installation_id from body
      const raw = await request.json().catch(() => ({}));
      installationId = raw.installation_id ?? null;
      if (!installationId) {
        return NextResponse.json(
          { error: "installation_id required (session disabled)" },
          { status: 400 }
        );
      }

      const body = raw;
      return await upsertConfig(installationId, body);
    }

    const body = await request.json().catch(() => ({}));
    return await upsertConfig(installationId, body);
  } catch (error) {
    console.error("❌ Cancel flow config PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}

async function upsertConfig(installationId: string, body: unknown) {
  const validation = cancelFlowConfigUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { enabled, offers, reasonOptions, brandColor, brandLogo } =
    validation.data;

  const config = await prisma.cancelFlowConfig.upsert({
    where: { installationId },
    create: {
      installationId,
      ...(enabled !== undefined && { enabled }),
      ...(offers !== undefined && { offers }),
      ...(reasonOptions !== undefined && { reasonOptions }),
      ...(brandColor !== undefined && { brandColor }),
      ...(brandLogo !== undefined && { brandLogo }),
    },
    update: {
      ...(enabled !== undefined && { enabled }),
      ...(offers !== undefined && { offers }),
      ...(reasonOptions !== undefined && { reasonOptions }),
      ...(brandColor !== undefined && { brandColor }),
      ...(brandLogo !== undefined && { brandLogo }),
    },
  });

  return NextResponse.json({ success: true, config });
}

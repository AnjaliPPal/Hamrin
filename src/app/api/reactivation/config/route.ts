import "server-only";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const campaignEmailSchema = z.object({
  dayOffset: z.number().int().min(1).max(365),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  offerType: z.enum(["percent_off", "none"]),
  offerValue: z.number().min(0).max(100),
});

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  emails: z.array(campaignEmailSchema).max(10).optional(),
});

async function resolveInstallationId(req: Request): Promise<string | null> {
  if (isSessionEnabled()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = getSessionFromToken(token);
    return session?.installationId ?? null;
  }
  const url = new URL(req.url);
  return url.searchParams.get("installation_id");
}

/** GET /api/reactivation/config — returns campaign config for this installation */
export async function GET(req: Request) {
  const installationId = await resolveInstallationId(req);
  if (!installationId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaign = await prisma.reactivationCampaign.findUnique({
    where: { installationId },
  });

  // Return defaults if not yet configured
  if (!campaign) {
    return Response.json({
      enabled: false,
      emails: [
        {
          dayOffset: 3,
          subject: "We miss you — come back?",
          body: "Hi there,\n\nWe noticed you recently cancelled your subscription.\n\nIf there's anything we can do better, we'd love to hear from you.\n\nClick below to reactivate whenever you're ready.",
          offerType: "none",
          offerValue: 0,
        },
        {
          dayOffset: 7,
          subject: "Still thinking about it? Here's 20% off",
          body: "Hi there,\n\nWe wanted to reach out one more time.\n\nWe'd love to have you back — and as a thank you, we're offering 20% off your first month back.",
          offerType: "percent_off",
          offerValue: 20,
        },
        {
          dayOffset: 14,
          subject: "Last chance — 30% off to reactivate",
          body: "Hi there,\n\nThis is our final check-in.\n\nIf you've been on the fence, here's our best offer: 30% off your first month back.",
          offerType: "percent_off",
          offerValue: 30,
        },
      ],
    });
  }

  return Response.json({ enabled: campaign.enabled, emails: campaign.emails });
}

/** PATCH /api/reactivation/config — update campaign settings */
export async function PATCH(req: Request) {
  const installationId = await resolveInstallationId(req);
  if (!installationId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { enabled, emails } = parsed.data;

  const data: Prisma.ReactivationCampaignUpdateInput = {};
  if (enabled !== undefined) data.enabled = enabled;
  if (emails !== undefined) data.emails = emails as unknown as Prisma.InputJsonValue;

  const campaign = await prisma.reactivationCampaign.upsert({
    where: { installationId },
    create: {
      installationId,
      enabled: enabled ?? false,
      emails: (emails ?? []) as unknown as Prisma.InputJsonValue,
    },
    update: data,
  });

  // Sync reactivationEnabled flag on Installation
  if (enabled !== undefined) {
    await prisma.installation.update({
      where: { id: installationId },
      data: { reactivationEnabled: enabled },
    });
  }

  return Response.json({ enabled: campaign.enabled, emails: campaign.emails });
}

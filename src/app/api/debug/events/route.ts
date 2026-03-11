import "server-only";
import { cookies } from "next/headers";
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Session guard
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = getSessionFromToken(token);

  if (isSessionEnabled() && !session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const installationId = session?.installationId ?? searchParams.get("installation");
  if (!installationId) return Response.json({ error: "Missing installationId" }, { status: 400 });

  // Verify this installation is in test mode
  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { id: true, livemode: true } as any,
  });
  if (!installation) return Response.json({ error: "Not found" }, { status: 404 });

  const events = await prisma.eventRaw.findMany({
    where: { installationId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      stripeEventId: true,
      eventType: true,
      createdAt: true,
      rawJson: true,
    },
  });

  return Response.json({ events });
}

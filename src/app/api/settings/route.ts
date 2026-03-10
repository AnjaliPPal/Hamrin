import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const smsEnabled = body.smsEnabled as boolean | undefined;

    if (typeof smsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid smsEnabled" },
        { status: 400 }
      );
    }

    let installationId: string | undefined;
    if (isSessionEnabled()) {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = getSessionFromToken(token);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      installationId = session.installationId;
    } else {
      installationId = body.installationId as string | undefined;
      if (!installationId) {
        return NextResponse.json(
          { error: "Missing installationId" },
          { status: 400 }
        );
      }
    }

    await prisma.installation.update({
      where: { id: installationId },
      data: { smsEnabled },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Settings update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const installationId = body.installationId as string | undefined;
    const smsEnabled = body.smsEnabled as boolean | undefined;

    if (!installationId || typeof smsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing installationId or smsEnabled" },
        { status: 400 }
      );
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

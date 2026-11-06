import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/tracks — historique des pistes. */
export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const status = req.nextUrl.searchParams.get("status");
  const where = status !== null && status !== "" ? { status: Number(status) } : {};
  const tracks = await db.track.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(500, Math.max(1, limit)),
  });
  return NextResponse.json({ tracks });
}

/** DELETE /api/tracks?id=... ou ?taskId=... — supprime une piste ou tout un lot. */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (id) {
    await db.track.delete({ where: { id } });
  } else if (taskId) {
    await db.track.deleteMany({ where: { taskId } });
  } else {
    return NextResponse.json({ error: "id ou taskId requis" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

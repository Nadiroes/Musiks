import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/datasets — liste des datasets LoRA enregistrés. */
export async function GET() {
  const datasets = await db.loraDataset.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ datasets });
}

/** POST /api/datasets — crée ou met à jour un dataset. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = body.id ? String(body.id) : null;
  const data = {
    name: String(body.name ?? "Nouveau dataset"),
    activationTag: String(body.activationTag ?? ""),
    tagPosition: ["prepend", "append", "replace"].includes(body.tagPosition) ? body.tagPosition : "prepend",
    allInstrumental: Boolean(body.allInstrumental ?? false),
    samplesJson: JSON.stringify(Array.isArray(body.samples) ? body.samples : []),
  };
  if (id) {
    const ds = await db.loraDataset.update({ where: { id }, data });
    return NextResponse.json({ dataset: ds });
  }
  const ds = await db.loraDataset.create({ data });
  return NextResponse.json({ dataset: ds });
}

/** DELETE /api/datasets?id=... */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.loraDataset.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

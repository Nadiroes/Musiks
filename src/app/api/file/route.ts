import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");

const MIME: Record<string, string> = {
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".flac": "audio/flac",
  ".ogg": "audio/ogg", ".opus": "audio/opus", ".m4a": "audio/mp4", ".aac": "audio/aac",
};

/** GET /api/file?name=... — sert un fichier uploadé depuis db/uploads. */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  const safe = path.basename(name); // anti path traversal
  const full = path.join(UPLOAD_DIR, safe);
  if (!existsSync(full) || !statSync(full).isFile()) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  const ext = path.extname(full).toLowerCase();
  const stream = createReadStream(full);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

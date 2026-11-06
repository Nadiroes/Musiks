import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";

/** GET /api/audio?path=... — proxy de téléchargement /v1/audio du serveur ACE-Step. */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path requis" }, { status: 400 });
  const settings = await getSettings();
  const base = settings.apiUrl.replace(/\/$/, "");
  const upstream = `${base}/v1/audio?path=${encodeURIComponent(path)}`;
  try {
    const headers: Record<string, string> = {};
    if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
    const res = await fetch(upstream, { headers, cache: "no-store" });
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: `Serveur ACE-Step: HTTP ${res.status}` }, { status: 502 });
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Content-Disposition": res.headers.get("content-disposition") || "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Serveur ACE-Step injoignable" },
      { status: 502 },
    );
  }
}

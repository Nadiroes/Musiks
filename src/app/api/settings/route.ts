import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings, aceFetch } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";

/** GET /api/settings — paramètres + état du serveur. */
export async function GET() {
  const settings = await getSettings();
  const probe = await aceFetch("/health", { timeoutMs: 3000 });
  return NextResponse.json({
    settings: { ...settings, apiKey: settings.apiKey ? "••••••••" : "" },
    hasKey: Boolean(settings.apiKey),
    online: probe.ok,
  });
}

/** PUT /api/settings — enregistre URL / clé / langue. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const patch: { apiUrl?: string; apiKey?: string; language?: string } = {};
  if (typeof body.apiUrl === "string" && body.apiUrl.trim()) {
    let url = body.apiUrl.trim();
    if (!/^https?:\/\//.test(url)) url = `http://${url}`;
    patch.apiUrl = url.replace(/\/$/, "");
  }
  if (typeof body.apiKey === "string" && !body.apiKey.startsWith("••")) {
    patch.apiKey = body.apiKey.trim();
  }
  if (typeof body.language === "string") patch.language = body.language;
  const saved = await saveSettings(patch);
  return NextResponse.json({
    settings: { ...saved, apiKey: saved.apiKey ? "••••••••" : "" },
    hasKey: Boolean(saved.apiKey),
  });
}

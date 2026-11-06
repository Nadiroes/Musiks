import { NextRequest, NextResponse } from "next/server";
import { aceFetch, pickError } from "@/lib/muziks/server";
import { EXAMPLE_CAPTIONS, EXAMPLE_LYRICS } from "@/lib/muziks/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/format-input — améliore caption + paroles via le LM du serveur.
 * Hors ligne : renvoie une amélioration locale (concaténation structurée).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "");
  const lyrics = String(body.lyrics ?? "");

  const r = await aceFetch("/format_input", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      lyrics,
      param_obj: JSON.stringify({
        duration: body.duration ?? null,
        bpm: body.bpm ?? null,
        key: body.key_scale ?? null,
        time_signature: body.time_signature ?? null,
        language: body.vocal_language ?? "unknown",
      }),
    }),
    timeoutMs: 60000,
  });

  if (r.ok) {
    const d = (r.data as { data?: Record<string, unknown> })?.data;
    if (d) return NextResponse.json({ mode: "server", data: d });
  }
  if (r.status !== 0) {
    // le serveur répond mais en erreur → propager
    return NextResponse.json({ error: pickError(r) }, { status: 502 });
  }

  // Démo locale : mise en forme heuristique
  const caption = prompt.trim()
    ? `${prompt.trim()} — production soignée, mixage équilibré, arrangement dynamique avec montée en intensité`
    : EXAMPLE_CAPTIONS[Math.floor(Math.random() * EXAMPLE_CAPTIONS.length)];
  let outLyrics = lyrics.trim();
  if (outLyrics && !outLyrics.includes("[Verse")) {
    outLyrics = `[Verse 1]\n${outLyrics}\n\n[Chorus]\n${outLyrics.split("\n").slice(-2).join("\n")}`;
  }
  if (!outLyrics) outLyrics = EXAMPLE_LYRICS;
  return NextResponse.json({
    mode: "demo",
    data: {
      caption, lyrics: outLyrics,
      bpm: body.bpm ?? 110, key_scale: body.key_scale ?? "C Major",
      time_signature: body.time_signature ?? "4", duration: body.duration ?? 180,
      vocal_language: body.vocal_language ?? "fr",
    },
  });
}

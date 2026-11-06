import { NextRequest, NextResponse } from "next/server";
import { aceFetch } from "@/lib/muziks/server";
import { SAMPLE_DESCRIPTIONS, EXAMPLE_CAPTIONS, EXAMPLE_LYRICS } from "@/lib/muziks/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/random-sample { sample_type } — tirage d'un exemple (bouton dé).
 * Hors ligne : tirage local.
 */
export async function POST(req: NextRequest) {
  const { sample_type = "simple_mode" } = await req.json().catch(() => ({ sample_type: "simple_mode" }));

  const r = await aceFetch("/create_random_sample", {
    method: "POST",
    body: JSON.stringify({ sample_type }),
    timeoutMs: 30000,
  });
  if (r.ok) {
    const d = (r.data as { data?: Record<string, unknown> })?.data;
    if (d) return NextResponse.json({ mode: "server", data: d });
  }

  // Tirage local
  if (sample_type === "simple_mode") {
    const q = SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)];
    return NextResponse.json({ mode: "demo", data: { sample_query: q } });
  }
  return NextResponse.json({
    mode: "demo",
    data: {
      caption: EXAMPLE_CAPTIONS[Math.floor(Math.random() * EXAMPLE_CAPTIONS.length)],
      lyrics: EXAMPLE_LYRICS,
      bpm: [90, 100, 110, 120, 128, 140][Math.floor(Math.random() * 6)],
      key_scale: ["C Major", "A minor", "G Major", "E minor", "F Major", "D minor"][Math.floor(Math.random() * 6)],
      time_signature: "4",
      duration: [30, 60, 120, 180][Math.floor(Math.random() * 4)],
      vocal_language: "fr",
    },
  });
}

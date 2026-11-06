import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { aceFetch } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");
const ALLOWED = [".wav", ".mp3", ".flac", ".ogg", ".opus", ".m4a", ".aac"];

/** Estime la durée d'un WAV (header PCM) ; renvoie null sinon. */
async function wavDuration(file: File): Promise<number | null> {
  try {
    const buf = Buffer.from(await file.slice(0, 128).arrayBuffer());
    if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") return null;
    const byteRate = buf.readUInt32LE(28);
    const size = file.size - 44;
    return byteRate > 0 ? Math.round((size / byteRate) * 10) / 10 : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/upload (FormData: file) — enregistre un audio côté serveur.
 * Hors ligne : analyse heuristique locale (durée WAV réelle, BPM/tonalité pseudo-déterministes).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase() || ".bin";
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: `Format non supporté (${ext}). Formats : ${ALLOWED.join(", ")}` }, { status: 400 });
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  const url = `/api/file?name=${encodeURIComponent(name)}`;
  const duration = await wavDuration(file);

  // Le serveur ACE-Step est-il là ? (analysons via LM si possible)
  const probe = await aceFetch("/health", { timeoutMs: 3000 });
  if (probe.ok) {
    // Analyse LM non exposée en REST (cf. API.md) → on retourne le chemin utilisable
    return NextResponse.json({
      mode: "server",
      file: { name: file.name, size: file.size, url, serverPath: path.join(UPLOAD_DIR, name), duration },
      note: "Fichier disponible pour Remix/Repaint/Extract/Lego/Complete. L'analyse LM complète est disponible via le Gradio UI (Transcribe).",
    });
  }

  // Analyse pseudo (démo) déterministe par nom+taille
  let h = 0;
  const seedStr = file.name + file.size;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  const bpms = [70, 80, 90, 100, 110, 120, 128, 140, 150, 160];
  const keys = ["C Major", "G Major", "D Major", "A Major", "A minor", "E minor", "F# minor", "F Major", "D minor", "Bb Major"];
  const bpm = bpms[Math.abs(h) % bpms.length];
  const keyScale = keys[Math.abs(h >> 3) % keys.length];
  const genres = ["Pop", "Rock", "Électronique", "Hip-Hop", "Jazz", "Ambient", "Folk", "Funk"];
  const genre = genres[Math.abs(h >> 6) % genres.length];
  const captions = [
    `${genre} moderne avec une production propre, basse ronde et percussions précises`,
    `${genre} atmosphérique avec nappes chaleureuses et groove régulier`,
    `${genre} énergique avec accroche mélodique et rythmique marquée`,
  ];
  const caption = captions[Math.abs(h >> 9) % captions.length];
  return NextResponse.json({
    mode: "demo",
    file: { name: file.name, size: file.size, url, duration },
    analysis: {
      bpm,
      key_scale: keyScale,
      time_signature: Math.abs(h >> 12) % 5 === 0 ? "3" : "4",
      duration: duration ?? 30 + (Math.abs(h >> 4) % 180),
      caption,
      vocal_language: Math.abs(h >> 7) % 3 === 0 ? "fr" : "en",
      heuristic: true,
    },
  });
}

/** GET /api/upload — diagnostic : nombre de pistes en base. */
export async function GET() {
  const count = await db.track.count();
  return NextResponse.json({ ok: true, tracks: count });
}

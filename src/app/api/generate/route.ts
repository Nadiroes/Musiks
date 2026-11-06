import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aceFetch, pickError } from "@/lib/muziks/server";
import { DEMO_TRACKS, MODES, type GenerationMode } from "@/lib/muziks/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = Record<string, unknown>;

function normMode(mode: string): string {
  return MODES.some((m) => m.id === mode) ? mode : "custom";
}

function hashPick<T>(arr: T[], seedStr: string): T {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

function titleFrom(prompt: string, mode: string): string {
  const label = MODES.find((m) => m.id === mode)?.label ?? "Studio";
  const base = (prompt || "").trim().split(/\s+/).slice(0, 5).join(" ");
  return base ? base.slice(0, 60) : label;
}

function buildLrc(lyrics: string, duration: number): string {
  const lines = lyrics.split("\n").filter((l) => l.trim() && !l.trim().startsWith("["));
  if (!lines.length) return "";
  const step = duration / Math.max(1, lines.length + 1);
  return lines
    .map((l, i) => {
      const t = (i + 1) * step;
      const m = String(Math.floor(t / 60)).padStart(2, "0");
      const s = (t % 60).toFixed(2).padStart(5, "0");
      return `[${m}:${s}]${l.trim()}`;
    })
    .join("\n");
}

/** POST /api/generate — soumet une tâche de génération (serveur réel) ou crée une simulation démo. */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let params: Params = {};
  let files: { ref: File | null; src: File | null } = { ref: null, src: null };
  let forwardBody: string | FormData | null = null;
  let forwardIsForm = false;

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    files.ref = (form.get("reference_audio") as File) || null;
    files.src = (form.get("src_audio") as File) || null;
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") {
        try {
          params[k] = JSON.parse(v);
        } catch {
          params[k] = v;
        }
      }
    }
    forwardBody = form; // le FormData d'origine contient aussi les fichiers
    forwardIsForm = true;
  } else {
    params = await req.json().catch(() => ({}));
  }

  const mode = normMode(String(params.mode ?? "custom"));
  const taskType = String(params.task_type ?? "text2music");
  const batch = Math.max(1, Math.min(8, Number(params.batch_size ?? 2) || 2));
  const duration = Number(params.audio_duration ?? 60) || 60;
  const prompt = String(params.prompt ?? "");
  const lyrics = String(params.lyrics ?? "");

  // Vérifie la disponibilité du serveur ACE-Step
  const probe = await aceFetch("/health", { timeoutMs: 3500 });
  const online = probe.ok;

  if (online) {
    // ---- Mode serveur réel : /release_task ----
    if (forwardIsForm && forwardBody) {
      const r = await aceFetch("/release_task", {
        method: "POST",
        body: forwardBody as FormData,
        timeoutMs: 55000,
      });
      if (!r.ok) {
        return NextResponse.json({ error: pickError(r) }, { status: 502 });
      }
      const data = r.data as { data?: { task_id?: string } };
      const taskId = data?.data?.task_id;
      if (!taskId) return NextResponse.json({ error: "Réponse inattendue du serveur (task_id manquant)" }, { status: 502 });
      const rows = Array.from({ length: batch }, (_, i) => ({
        taskId, batchIndex: i, title: titleFrom(prompt, mode), mode: taskType,
        status: 0, prompt, lyrics,
        bpm: params.bpm ? Number(params.bpm) : null,
        keyScale: params.key_scale ? String(params.key_scale) : null,
        timeSignature: params.time_signature ? String(params.time_signature) : null,
        duration, audioFormat: String(params.audio_format ?? "mp3"),
        paramsJson: JSON.stringify({ ...params, demo: false }),
      }));
      await db.track.createMany({ data: rows });
      const tracks = await db.track.findMany({ where: { taskId }, orderBy: { batchIndex: "asc" } });
      return NextResponse.json({ mode: "server", taskId, tracks });
    } else {
      const payload: Params = { ...params, task_type: taskType };
      delete payload.mode;
      const r = await aceFetch("/release_task", {
        method: "POST",
        body: JSON.stringify(payload),
        timeoutMs: 55000,
      });
      if (!r.ok) {
        return NextResponse.json({ error: pickError(r) }, { status: 502 });
      }
      const data = r.data as { data?: { task_id?: string } };
      const taskId = data?.data?.task_id;
      if (!taskId) return NextResponse.json({ error: "Réponse inattendue du serveur (task_id manquant)" }, { status: 502 });
      const rows = Array.from({ length: batch }, (_, i) => ({
        taskId, batchIndex: i, title: titleFrom(prompt, mode), mode: taskType,
        status: 0, prompt, lyrics,
        bpm: params.bpm ? Number(params.bpm) : null,
        keyScale: params.key_scale ? String(params.key_scale) : null,
        timeSignature: params.time_signature ? String(params.time_signature) : null,
        duration, audioFormat: String(params.audio_format ?? "mp3"),
        paramsJson: JSON.stringify({ ...params, demo: false }),
      }));
      await db.track.createMany({ data: rows });
      const tracks = await db.track.findMany({ where: { taskId }, orderBy: { batchIndex: "asc" } });
      return NextResponse.json({ mode: "server", taskId, tracks });
    }
  }

  // ---- Mode démo (serveur ACE-Step absent) : simulation ----
  const taskId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const simSeconds = 7 + batch * 2.5;
  const rows = Array.from({ length: batch }, (_, i) => {
    const demo = hashPick(DEMO_TRACKS, `${taskId}-${i}-${prompt}`);
    const seed = params.use_random_seed === false && params.seed ? String(params.seed) : String(Math.floor(Math.random() * 4294967295));
    return {
      taskId, batchIndex: i,
      title: `${titleFrom(prompt, mode)} #${i + 1}`,
      mode: taskType, status: 0, prompt, lyrics,
      bpm: params.bpm ? Number(params.bpm) : demo.bpm,
      keyScale: params.key_scale ? String(params.key_scale) : demo.key,
      timeSignature: params.time_signature ? String(params.time_signature) : demo.ts,
      duration, audioFormat: String(params.audio_format ?? "mp3"),
      seed,
      paramsJson: JSON.stringify({
        ...params, demo: true, simSeconds, demoFile: demo.file,
        demoGenre: demo.genre, demoTitle: demo.title,
      }),
    };
  });
  await db.track.createMany({ data: rows });
  const tracks = await db.track.findMany({ where: { taskId }, orderBy: { batchIndex: "asc" } });
  return NextResponse.json({ mode: "demo", taskId, tracks });
}

/** GET /api/generate — infos de compatibilité (modes supportés selon modèle). */
export async function GET() {
  return NextResponse.json({ modes: MODES.map((m) => m.id) });
}

export type { GenerationMode };

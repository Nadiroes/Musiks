import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aceFetch, pickError } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";

function parseParams(t: { paramsJson: string }): Record<string, unknown> {
  try {
    return JSON.parse(t.paramsJson || "{}");
  } catch {
    return {};
  }
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

/** POST /api/task { taskId } — interroge l'état d'une tâche et met à jour les pistes. */
export async function POST(req: NextRequest) {
  const { taskId } = await req.json().catch(() => ({ taskId: null }));
  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json({ error: "taskId requis" }, { status: 400 });
  }
  const tracks = await db.track.findMany({ where: { taskId }, orderBy: { batchIndex: "asc" } });
  if (!tracks.length) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }
  const params = parseParams(tracks[0]);

  // ---------- Simulation démo ----------
  if (params.demo === true) {
    const simSeconds = Number(params.simSeconds ?? 12);
    const elapsed = (Date.now() - new Date(tracks[0].createdAt).getTime()) / 1000;
    const progress = Math.min(1, elapsed / simSeconds);
    if (progress >= 1 && tracks[0].status === 0) {
      const demoFile = String(params.demoFile ?? "/demo/neon-skyline.wav");
      const demoGenre = String(params.demoGenre ?? "Démo");
      await Promise.all(
        tracks.map((t) => {
          const score = Math.round((0.78 + Math.random() * 0.2) * 1000) / 1000;
          return db.track.update({
            where: { id: t.id },
            data: {
              status: 1,
              audioUrl: demoFile,
              score,
              lrc: buildLrc(t.lyrics || t.prompt, t.duration || 30),
              metaJson: JSON.stringify({ genre: demoGenre, lm_model: "acestep-5Hz-lm-0.6B", dit_model: "acestep-v15-turbo", demo: true }),
            },
          });
        }),
      );
    }
    const fresh = await db.track.findMany({ where: { taskId }, orderBy: { batchIndex: "asc" } });
    const allDone = fresh.every((t) => t.status !== 0);
    return NextResponse.json({
      mode: "demo",
      status: allDone ? 1 : 0,
      progress: Math.round(progress * 100),
      phase: progress < 0.35 ? "Planification LM (CoT)" : progress < 0.8 ? "Diffusion DiT" : "Décodage VAE & encodage audio",
      tracks: fresh,
    });
  }

  // ---------- Serveur ACE-Step réel ----------
  const r = await aceFetch("/query_result", {
    method: "POST",
    body: JSON.stringify({ task_id_list: [taskId] }),
    timeoutMs: 12000,
  });
  if (!r.ok) {
    return NextResponse.json({ error: pickError(r) }, { status: 502 });
  }
  const data = r.data as { data?: { status?: number; result?: string; error?: string }[] };
  const entry = data?.data?.[0];
  if (!entry) return NextResponse.json({ error: "Réponse inattendue du serveur" }, { status: 502 });

  let items: Record<string, unknown>[] = [];
  try {
    items = JSON.parse(entry.result || "[]");
  } catch {
    items = [];
  }

  // Met à jour chaque piste du lot avec le résultat correspondant
  const updates = tracks.map(async (t, i) => {
    const item = items[i];
    if (!item) return t;
    const st = Number(item.status ?? 0);
    if (st === 0 && t.status === 1) return t;
    const fileUrl = typeof item.file === "string" && item.file ? item.file : null;
    const serverPath = fileUrl?.includes("path=") ? decodeURIComponent(fileUrl.split("path=")[1]) : fileUrl;
    const metas = (item.metas ?? {}) as Record<string, unknown>;
    const seedValue = typeof item.seed_value === "string" ? item.seed_value.split(",")[i] ?? item.seed_value : null;
    return db.track.update({
      where: { id: t.id },
      data: {
        status: st,
        serverPath,
        audioUrl: serverPath ? `/api/audio?path=${encodeURIComponent(serverPath)}` : null,
        error: st === 2 ? String((entry as { error?: string }).error ?? "Génération échouée") : null,
        bpm: metas.bpm ? Number(metas.bpm) : t.bpm,
        keyScale: metas.keyscale ? String(metas.keyscale) : t.keyScale,
        timeSignature: metas.timesignature ? String(metas.timesignature) : t.timeSignature,
        duration: metas.duration ? Number(metas.duration) : t.duration,
        seed: seedValue ?? t.seed,
        metaJson: JSON.stringify({
          lm_model: item.lm_model, dit_model: item.dit_model,
          generation_info: item.generation_info, env: item.env, create_time: item.create_time,
        }),
      },
    });
  });
  const fresh = await Promise.all(updates);
  const allDone = fresh.every((t) => t.status !== 0);
  return NextResponse.json({
    mode: "server",
    status: entry.status,
    progress: allDone ? 100 : 50,
    phase: allDone ? "Terminé" : "Génération en cours sur le serveur",
    tracks: fresh,
  });
}

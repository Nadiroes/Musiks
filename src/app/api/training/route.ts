import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aceFetch, pickError } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";

const SIM_SECONDS = 45; // durée simulée d'un entraînement démo

const SIM_LOG_STEPS = [
  "Chargement du dataset de tenseurs précalculés…",
  "Initialisation du modèle DiT + adaptateur LoRA (r=64, alpha=128)",
  "Epoch 12/500 — loss 2.417, lr 1.0e-4",
  "Epoch 120/500 — loss 1.662, lr 1.0e-4",
  "Epoch 260/500 — loss 1.204, lr 1.0e-4",
  "Epoch 380/500 — loss 0.987, lr 1.0e-4",
  "Epoch 500/500 — loss 0.812 — entraînement terminé",
  "Export de l'adaptateur vers ./lora_output/muziks-style.safetensors",
];

/** GET /api/training — liste des runs (avec progression démo rafraîchie). */
export async function GET() {
  const runs = await db.trainingRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  // progression démo basée sur le temps écoulé
  const now = Date.now();
  for (const run of runs) {
    const params = safeParse(run.paramsJson);
    if (params.demo === true && run.status === 0) {
      const elapsed = (now - new Date(run.createdAt).getTime()) / 1000;
      const progress = Math.min(100, Math.round((elapsed / SIM_SECONDS) * 100));
      const stepIdx = Math.min(SIM_LOG_STEPS.length - 1, Math.floor((progress / 100) * (SIM_LOG_STEPS.length - 1)));
      const log = SIM_LOG_STEPS.slice(0, stepIdx + 1).join("\n");
      if (progress >= 100) {
        await db.trainingRun.update({
          where: { id: run.id },
          data: { status: 1, progress: 100, log: log + "\n✓ LoRA exporté — utilisable dans le Studio (LoRA Path)" },
        });
      } else if (log !== run.log) {
        await db.trainingRun.update({ where: { id: run.id }, data: { progress, log } });
      }
    }
  }
  const fresh = await db.trainingRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ runs: fresh, serverStatus: await trainingServerStatus() });
}

async function trainingServerStatus() {
  const r = await aceFetch("/v1/training/status", { timeoutMs: 4000 });
  return r.ok ? r.data : null;
}

/** POST /api/training — démarre un entraînement LoRA ou LoKr. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "lokr" ? "lokr" : "lora";
  const name = String(body.name ?? "Mon style");
  const params = body.params ?? {};

  const probe = await aceFetch("/health", { timeoutMs: 3000 });
  if (probe.ok) {
    const path = kind === "lora" ? "/v1/training/start" : "/v1/training/start_lokr";
    const r = await aceFetch(path, {
      method: "POST",
      body: JSON.stringify({ ...params, output_dir: params.output_dir ?? "./lora_output" }),
      timeoutMs: 30000,
    });
    if (!r.ok) return NextResponse.json({ error: pickError(r) }, { status: 502 });
    const run = await db.trainingRun.create({
      data: {
        name, kind, status: 0,
        datasetPath: String(params.tensor_dir ?? ""),
        outputDir: String(params.output_dir ?? "./lora_output"),
        paramsJson: JSON.stringify({ ...params, demo: false }),
        log: "Tâche d'entraînement envoyée au serveur ACE-Step.",
      },
    });
    return NextResponse.json({ mode: "server", run });
  }

  // Démo : simulation
  const run = await db.trainingRun.create({
    data: {
      name, kind, status: 0,
      datasetPath: String(params.tensor_dir ?? "./datasets/tensors"),
      outputDir: String(params.output_dir ?? "./lora_output"),
      paramsJson: JSON.stringify({ ...params, demo: true }),
      log: SIM_LOG_STEPS[0],
    },
  });
  return NextResponse.json({ mode: "demo", run });
}

/** PUT /api/training — stoppe un run (démo) ou envoie /v1/training/stop (serveur). */
export async function PUT(req: NextRequest) {
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const run = await db.trainingRun.findUnique({ where: { id } });
  if (!run) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });
  const params = safeParse(run.paramsJson);

  if (params.demo === true) {
    await db.trainingRun.update({
      where: { id },
      data: { status: 3, log: run.log + "\n⏹ Entraînement interrompu par l'utilisateur" },
    });
    return NextResponse.json({ ok: true, mode: "demo" });
  }
  const r = await aceFetch("/v1/training/stop", { method: "POST", body: JSON.stringify({}), timeoutMs: 8000 });
  await db.trainingRun.update({
    where: { id },
    data: { status: 3, log: run.log + "\n⏹ Arrêt demandé au serveur" },
  });
  return NextResponse.json({ ok: true, mode: "server", serverResponse: r.ok ? r.data : pickError(r) });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

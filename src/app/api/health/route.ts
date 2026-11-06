import { NextResponse } from "next/server";
import { aceFetch, pickError } from "@/lib/muziks/server";

export const dynamic = "force-dynamic";

/** Statut du serveur ACE-Step : /health + /v1/models + /v1/stats */
export async function GET() {
  const health = await aceFetch("/health", { timeoutMs: 4000 });
  if (!health.ok) {
    return NextResponse.json({
      online: false,
      error: pickError(health),
      health: null, models: null, stats: null,
    });
  }
  const [models, stats] = await Promise.all([
    aceFetch("/v1/models", { timeoutMs: 5000 }),
    aceFetch("/v1/stats", { timeoutMs: 5000 }),
  ]);
  return NextResponse.json({
    online: true,
    health: health.data,
    models: models.ok ? models.data : null,
    stats: stats.ok ? stats.data : null,
  });
}

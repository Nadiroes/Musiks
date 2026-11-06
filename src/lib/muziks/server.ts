// Utilitaires serveur pour Muziks : settings DB + client HTTP ACE-Step
import { db } from "@/lib/db";

export type AppSettings = {
  apiUrl: string;
  apiKey: string;
  language: string;
};

export async function getSettings(): Promise<AppSettings> {
  const s = await db.appSettings.findUnique({ where: { id: "singleton" } });
  if (s) return { apiUrl: s.apiUrl, apiKey: s.apiKey, language: s.language };
  return { apiUrl: "http://127.0.0.1:8001", apiKey: "", language: "fr" };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.appSettings.upsert({
    where: { id: "singleton" },
    update: { apiUrl: next.apiUrl, apiKey: next.apiKey, language: next.language },
    create: { id: "singleton", ...next },
  });
  return next;
}

/** Appel vers le serveur ACE-Step avec timeout et tolérance d'erreur. */
export async function aceFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const settings = await getSettings();
  const base = settings.apiUrl.replace(/\/$/, "");
  const { timeoutMs = 15000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    // Ne pas propager Content-Type pour les FormData (le fetch gère le boundary)
    if (rest.body && typeof rest.body === "string") headers["Content-Type"] = "application/json";
    if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
    const res = await fetch(`${base}${path}`, {
      ...rest,
      headers: { ...headers, ...(rest.headers as Record<string, string> | undefined) },
      signal: controller.signal,
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : await res.text();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/** Tente un appel ; renvoie online=false si le serveur est injoignable. */
export async function aceTry(path: string, init?: RequestInit & { timeoutMs?: number }) {
  const r = await aceFetch(path, { timeoutMs: init?.timeoutMs ?? 6000, ...init });
  return { online: r.ok, ...r };
}

export function pickError(r: { status: number; error?: string; data: unknown }): string {
  if (r.error) return r.error;
  const d = r.data as { error?: string; detail?: string } | null;
  if (d && typeof d === "object") {
    if (d.error) return String(d.error);
    if (d.detail) return typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
  }
  if (typeof r.data === "string" && r.data) return r.data.slice(0, 300);
  return `Erreur HTTP ${r.status}`;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play, Download, Trash2, RotateCcw, SendToBack, Search, Library as LibIcon,
} from "lucide-react";
import { useMuziks } from "@/lib/muziks/store";
import { SectionHead, StatusBadge } from "../ui-bits";

type LibTrack = {
  id: string; taskId: string | null; batchIndex: number; title: string; mode: string;
  status: number; prompt: string; bpm: number | null; keyScale: string | null;
  timeSignature: string | null; duration: number | null; audioFormat: string;
  seed: string | null; audioUrl: string | null; score: number | null;
  paramsJson: string; createdAt: string;
};

const MODE_LABEL: Record<string, string> = {
  text2music: "Text2Music", cover: "Cover/Remix", repaint: "Repaint",
  extract: "Extract", lego: "Lego", complete: "Complete",
};

export function LibraryView() {
  const [tracks, setTracks] = useState<LibTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const play = useMuziks((s) => s.play);
  const sendSrc = useMuziks((s) => s.sendSrcToStudio);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/tracks?limit=200");
      const d = await r.json();
      setTracks(d.tracks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (t: LibTrack) => {
    await fetch(`/api/tracks?id=${t.id}`, { method: "DELETE" });
    toast({ title: "Piste supprimée" });
    load();
  };

  const filtered = tracks.filter((t) =>
    !q.trim() ||
    `${t.title} ${t.prompt} ${t.mode} ${t.keyScale ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  const restore = (t: LibTrack) => {
    try {
      const p = JSON.parse(t.paramsJson || "{}");
      useMuziks.getState().sendToStudio({
        mode: p.mode, description: p.sample_query ?? "", caption: p.prompt ?? "",
        lyrics: p.lyrics ?? "", bpm: p.bpm ?? "", keyScale: p.key_scale ?? "auto",
        timeSignature: p.time_signature ?? "auto", duration: p.audio_duration ?? 60,
        autoDuration: p.audio_duration == null, batch: p.batch_size ?? 2,
        thinking: p.thinking ?? true, steps: p.inference_steps ?? 8, format: p.audio_format ?? "mp3",
      });
    } catch {
      toast({ title: "Paramètres illisibles", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <SectionHead
        title="Bibliothèque"
        sub="Toutes vos générations : rejouez, téléchargez, chaînez vers le Studio (→ Source) ou restaurez les paramètres exacts."
        right={
          <Button variant="secondary" size="sm" onClick={load}>Rafraîchir</Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Rechercher (titre, prompt, mode…)…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-2">
            <LibIcon className="size-8 mx-auto text-amber-500/50" />
            <p className="font-medium">Bibliothèque vide</p>
            <p className="text-sm text-muted-foreground">Lancez une génération dans le Studio — chaque tâche apparaîtra ici.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className={t.status === 2 ? "border-red-500/40" : undefined}>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {MODE_LABEL[t.mode] ?? t.mode} · {new Date(t.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <StatusBadge status={(t.status as 0 | 1 | 2)} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.bpm != null && <Badge variant="secondary" className="text-[10px]">{t.bpm} BPM</Badge>}
                  {t.keyScale && <Badge variant="secondary" className="text-[10px]">{t.keyScale}</Badge>}
                  {t.duration != null && <Badge variant="secondary" className="text-[10px]">{Math.round(t.duration)}s</Badge>}
                  {t.seed && <Badge variant="secondary" className="text-[10px]">seed {t.seed}</Badge>}
                  {t.score != null && <Badge variant="secondary" className="text-[10px]">score {t.score.toFixed(2)}</Badge>}
                </div>
                {t.prompt && <p className="text-xs text-muted-foreground line-clamp-2">{t.prompt || t.paramsJson}</p>}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {t.status === 1 && t.audioUrl && (
                    <Button
                      size="sm" variant="secondary"
                      onClick={() => play({ id: t.id, title: t.title, url: t.audioUrl!, prompt: t.prompt, bpm: t.bpm, keyScale: t.keyScale, duration: t.duration })}
                    >
                      <Play className="size-3.5 mr-1" /> Écouter
                    </Button>
                  )}
                  {t.audioUrl && (
                    <Button size="sm" variant="ghost" onClick={() => {
                      const a = document.createElement("a");
                      a.href = t.audioUrl!;
                      a.download = `${t.title}.${t.audioFormat === "wav32" ? "wav" : t.audioFormat || "mp3"}`;
                      a.target = "_blank"; a.rel = "noopener"; a.click();
                    }}>
                      <Download className="size-3.5 mr-1" /> Exporter
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => sendSrc({ url: t.audioUrl || "", name: t.title })} disabled={!t.audioUrl}>
                    <SendToBack className="size-3.5 mr-1" /> → Source
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => restore(t)}>
                    <RotateCcw className="size-3.5 mr-1" /> Paramètres
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => remove(t)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

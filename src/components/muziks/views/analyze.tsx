"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AudioWaveform, Upload, Loader2, SendToBack, Music4, Info, Copy, FileText,
} from "lucide-react";
import { useMuziks } from "@/lib/muziks/store";
import { SectionHead } from "../ui-bits";

type Analysis = {
  bpm: number;
  key_scale: string;
  time_signature: string;
  duration: number;
  caption: string;
  vocal_language: string;
  heuristic?: boolean;
};

export function AnalyzeView() {
  const [file, setFile] = useState<File | null>(null);
  const [objUrl, setObjUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ mode: string; analysis?: Analysis; note?: string; url?: string; name?: string; duration?: number | null } | null>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl(f ? URL.createObjectURL(f) : "");
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(10);
    setResult(null);
    const fake = setInterval(() => setProgress((p) => Math.min(90, p + 9)), 260);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Analyse impossible");
      setResult({ mode: d.mode, analysis: d.analysis, note: d.note, url: d.file?.url, name: d.file?.name, duration: d.file?.duration });
      setProgress(100);
      if (d.mode === "server") {
        toast({ title: "Fichier prêt", description: d.note });
      } else {
        toast({ title: "Analyse terminée (heuristique démo)" });
      }
    } catch (e) {
      toast({ title: "Erreur d'analyse", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      clearInterval(fake);
      setBusy(false);
    }
  };

  const a = result?.analysis;

  return (
    <div className="space-y-5">
      <SectionHead
        title="Analyse audio (Audio Understanding)"
        sub="Chargez un morceau : Muziks en extrait BPM, tonalité, mesure, durée, langue du chant et une caption réutilisable dans le Studio."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5 space-y-4">
            <label className="cursor-pointer block rounded-xl border-2 border-dashed p-8 text-center hover:border-amber-500/50 transition-colors">
              <input type="file" accept="audio/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              <AudioWaveform className="size-8 mx-auto text-amber-400 mb-2" />
              <p className="text-sm font-medium">{file ? file.name : "Choisir un fichier audio"}</p>
              <p className="text-xs text-muted-foreground mt-1">wav, mp3, flac, ogg, opus, m4a — traité côté serveur, jamais envoyé ailleurs.</p>
            </label>
            {objUrl && <audio controls src={objUrl} className="w-full h-9" preload="metadata" />}
            <Button className="w-full" onClick={analyze} disabled={!file || busy}>
              {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
              Analyser le morceau
            </Button>
            {busy && <Progress value={progress} className="h-2" />}

            <div className="rounded-lg border bg-black/20 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <b className="text-foreground">Mode réel :</b> le fichier est déposé sur le serveur ACE-Step et utilisable
                dans Remix / Repaint / Extract / Lego / Complete. L&apos;analyse LM complète (« Transcribe » + codes 5Hz)
                est exposée dans le Gradio UI officiel ; Muziks indique alors le chemin serveur du fichier.
                <b className="text-foreground"> Mode démo :</b> analyse heuristique déterministe (durée réelle pour les WAV).
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">Résultat d&apos;analyse</h3>
            {!result && !busy && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Chargez un fichier puis lancez l&apos;analyse.
              </div>
            )}
            {a && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { l: "BPM", v: String(a.bpm) },
                    { l: "Tonalité", v: a.key_scale },
                    { l: "Mesure", v: a.time_signature === "3" ? "3/4" : a.time_signature === "6" ? "6/8" : a.time_signature === "2" ? "2/4" : "4/4" },
                    { l: "Durée", v: `${Math.round(a.duration)} s` },
                    { l: "Langue du chant", v: a.vocal_language },
                    { l: "Méthode", v: a.heuristic ? "heuristique (démo)" : "LM ACE-Step" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg border bg-black/20 p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.l}</p>
                      <p className="text-sm font-semibold text-amber-300">{m.v}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium flex items-center gap-1"><Music4 className="size-3.5 text-amber-400" /> Caption détectée</p>
                  <div className="rounded-lg border bg-black/20 p-3 text-sm">{a.caption}</div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm" variant="secondary"
                      onClick={() => {
                        useMuziks.getState().sendToStudio({
                          mode: "custom", caption: a.caption, bpm: String(a.bpm),
                          keyScale: a.key_scale, timeSignature: a.time_signature,
                          autoDuration: false, duration: Math.min(600, Math.round(a.duration)),
                        });
                      }}
                    >
                      Réutiliser dans le Studio
                    </Button>
                    {result?.url && (
                      <Button size="sm" variant="ghost" onClick={() => useMuziks.getState().sendSrcToStudio({ url: result.url!, name: result.name || "source" })}>
                        <SendToBack className="size-3.5 mr-1" /> → Source
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(a.caption)}>
                      <Copy className="size-3.5 mr-1" /> Copier
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {result && !a && (
              <div className="space-y-2 text-sm">
                <Badge variant="secondary">Fichier enregistré</Badge>
                <p className="text-muted-foreground text-xs">{result.note}</p>
                {result.url && (
                  <Button size="sm" variant="secondary" onClick={() => useMuziks.getState().sendSrcToStudio({ url: result.url!, name: result.name || "source" })}>
                    <SendToBack className="size-3.5 mr-1" /> Envoyer vers Source (Studio)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4 text-amber-400" /> À propos de la transcription LM</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dans ACE-Step 1.5, la compréhension audio s&apos;appuie sur le LM 5Hz : il convertit un audio en
            <b className="text-foreground"> codes sémantiques 5Hz</b>, puis en déduit les méta-données et la caption
            (« Transcribe » dans le Gradio UI). Ces codes peuvent ensuite être collés dans le mode Personnalisé
            (LM Codes Hints) pour contrôler la structure mélodique sans ré-uploader l&apos;audio.
            L&apos;API REST officielle n&apos;expose pas encore cet endpoint — Muziks reste fidèle à la doc{" "}
            <a className="text-amber-400 hover:underline" href="https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/API.md" target="_blank" rel="noopener noreferrer">docs/en/API.md</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

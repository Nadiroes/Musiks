"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2, SlidersHorizontal, Shuffle, Paintbrush, Split, Blocks, ListMusic, MicVocal,
  Dices, Sparkles, Music4, Download, Play, RotateCcw, SendToBack, FileAudio2,
  Loader2, ChevronDown, Copy, FileText, Gauge, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMuziks, type PlayerTrack } from "@/lib/muziks/store";
import { SectionHead, StatusBadge } from "../ui-bits";
import {
  MODES, TRACK_NAMES, VOCAL_LANGUAGES, AUDIO_FORMATS, KEYS, TIME_SIGNATURES,
  SAMPLE_DESCRIPTIONS, EXAMPLE_CAPTIONS, type GenerationMode,
} from "@/lib/muziks/constants";

type ModeId = GenerationMode;

type TrackResult = {
  id: string;
  batchIndex: number;
  title: string;
  status: number;
  prompt: string;
  lyrics: string;
  bpm: number | null;
  keyScale: string | null;
  timeSignature: string | null;
  duration: number | null;
  audioFormat: string;
  seed: string | null;
  audioUrl: string | null;
  serverPath: string | null;
  lrc: string | null;
  score: number | null;
  error: string | null;
  paramsJson: string;
  metaJson: string;
};

const MODE_ICONS: Record<ModeId, React.ComponentType<{ className?: string }>> = {
  simple: Wand2, custom: SlidersHorizontal, remix: Shuffle, repaint: Paintbrush,
  extract: Split, lego: Blocks, complete: ListMusic, v2bgm: MicVocal,
};

const DEFAULT_PARAMS = {
  // métadonnées
  bpm: "", keyScale: "auto", timeSignature: "auto", duration: 60, autoDuration: true,
  batch: 2, language: "unknown", instrumental: false, format: "mp3",
  // diffusion
  thinking: true, useFormat: false, steps: 8, guidance: 7.0,
  randomSeed: true, seed: "-1", shift: 3.0, method: "ode", timesteps: "",
  adg: false, cfgStart: 0.0, cfgEnd: 1.0,
  // LM
  lmTemp: 0.85, lmCfg: 2.5, lmTopK: 0, lmTopP: 0.9, lmRep: 1.0,
  cotCaption: true, cotLanguage: true, constrained: true,
  // édition
  coverStrength: 1.0, repaintStart: 0, repaintEnd: -1, maskMode: "auto",
};

type FormState = typeof DEFAULT_PARAMS & {
  mode: ModeId;
  description: string;
  caption: string;
  lyrics: string;
  trackName: string;
  trackNames: string[];
};

const INITIAL: FormState = {
  ...DEFAULT_PARAMS, mode: "simple",
  description: "", caption: "", lyrics: "",
  trackName: "vocals", trackNames: ["drums"],
};

export function StudioView() {
  const { server, restoreToken, restoreParams, srcHandoff, srcHandoffToken } = useMuziks();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [srcFile, setSrcFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string>("");
  const [srcObjUrl, setSrcObjUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState<{ mode: string; taskId: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const online = server.online === true;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const modeDef = MODES.find((m) => m.id === form.mode)!;
  const needsSrc = modeDef.needsSrc;

  // Restauration de paramètres (depuis la bibliothèque / résultats)
  useEffect(() => {
    if (!restoreParams) return;
    const p = restoreParams as Partial<FormState> & Record<string, unknown>;
    setForm((f) => ({
      ...f,
      ...p,
      bpm: (p.bpm as number | string | undefined) != null ? String(p.bpm) : f.bpm,
    }));
    setResults([]);
    setGen(null);
    toast({ title: "Paramètres restaurés dans le Studio" });
  }, [restoreToken]);

  // Envoi d'un fichier source depuis la bibliothèque / analyse
  useEffect(() => {
    if (srcHandoff) {
      setSrcUrl(srcHandoff.url);
      setSrcObjUrl(srcHandoff.url);
      setSrcFile(null);
      toast({ title: "Audio source prêt", description: srcHandoff.name });
    }
  }, [srcHandoffToken]);

  const pickSrc = (file: File | null) => {
    setSrcFile(file);
    if (srcObjUrl && srcObjUrl.startsWith("blob:")) URL.revokeObjectURL(srcObjUrl);
    if (file) setSrcObjUrl(URL.createObjectURL(file));
    else setSrcObjUrl("");
    setSrcUrl("");
  };

  // ---------- Construction du payload ----------
  const buildPayload = useCallback((): { json: Record<string, unknown>; useForm: boolean } => {
    const modeDef_ = MODES.find((m) => m.id === form.mode)!;
    const json: Record<string, unknown> = {
      mode: form.mode,
      task_type: modeDef_.taskType,
      audio_format: form.format,
      batch_size: form.batch,
      use_random_seed: form.randomSeed,
      seed: form.randomSeed ? -1 : Number(form.seed) || -1,
      thinking: form.thinking && !["cover", "repaint", "extract"].includes(modeDef_.taskType),
      use_cot_caption: form.cotCaption,
      use_cot_language: form.cotLanguage,
      constrained_decoding: form.constrained,
      vocal_language: form.instrumental ? "unknown" : form.language,
      lm_temperature: form.lmTemp,
      lm_cfg_scale: form.lmCfg,
      lm_top_k: form.lmTopK || 0,
      lm_top_p: form.lmTopP,
      lm_repetition_penalty: form.lmRep,
      infer_method: form.method,
    };
    // métadonnées
    if (!form.autoDuration) json.audio_duration = form.duration;
    if (form.bpm && Number(form.bpm) > 0) json.bpm = Number(form.bpm);
    if (form.keyScale !== "auto") json.key_scale = form.keyScale;
    if (form.timeSignature !== "auto") json.time_signature = form.timeSignature;
    // diffusion avancée
    json.inference_steps = form.steps;
    if (form.timesteps.trim()) json.timesteps = form.timesteps.trim();
    json.use_adg = form.adg;
    json.cfg_interval_start = form.cfgStart;
    json.cfg_interval_end = form.cfgEnd;
    if (!["turbo"].includes("") && !form.adg) { /* guidance utile pour modèles base */ }
    json.guidance_scale = form.guidance;

    switch (form.mode) {
      case "simple":
        json.sample_query = form.description;
        break;
      case "custom":
        json.prompt = form.caption;
        json.lyrics = form.instrumental ? "" : form.lyrics;
        break;
      case "remix":
        json.prompt = form.caption;
        json.lyrics = form.instrumental ? "" : form.lyrics;
        json.audio_cover_strength = form.coverStrength;
        break;
      case "repaint":
        json.prompt = form.caption;
        json.lyrics = form.instrumental ? "" : form.lyrics;
        json.repainting_start = form.repaintStart;
        json.repainting_end = form.repaintEnd;
        json.chunk_mask_mode = form.maskMode;
        break;
      case "extract":
        json.instruction = `extract ${form.trackName}`;
        json.lyrics = "";
        break;
      case "lego":
        json.prompt = form.caption;
        json.lyrics = form.instrumental ? "" : form.lyrics;
        json.instruction = `add ${form.trackName} layer: ${form.caption}`;
        break;
      case "complete":
        json.prompt = form.caption;
        json.lyrics = form.instrumental ? "" : form.lyrics;
        json.instruction = `complete tracks: ${form.trackNames.join(", ")}`;
        break;
      case "v2bgm":
        json.prompt = form.caption || "instrumental background music accompaniment, remove vocals, full arrangement";
        json.audio_cover_strength = 0.85;
        json.instruction = "Remove vocals and generate a full instrumental background music accompaniment";
        break;
    }
    const useFileForm = Boolean(refFile || srcFile);
    return { json, useForm: useFileForm };
  }, [form, refFile, srcFile]);

  // ---------- Soumission ----------
  const submit = async () => {
    if (needsSrc && !srcFile && !srcUrl) {
      toast({ title: "Audio source requis", description: `Le mode ${modeDef.label} nécessite un fichier audio.`, variant: "destructive" });
      return;
    }
    if (form.mode === "simple" && !form.description.trim()) {
      toast({ title: "Description requise", description: "Décrivez la chanson souhaitée.", variant: "destructive" });
      return;
    }
    if (form.mode === "custom" && !form.caption.trim()) {
      toast({ title: "Caption requise", description: "Décrivez la musique à générer.", variant: "destructive" });
      return;
    }
    setBusy(true);
    setResults([]);
    setGen(null);
    setProgress(0);
    setPhase("Envoi de la tâche…");
    try {
      const { json, useForm } = buildPayload();
      let res: Response;
      if (useForm) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(json)) {
          fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        }
        if (refFile) fd.append("reference_audio", refFile, refFile.name);
        if (srcFile) fd.append("src_audio", srcFile, srcFile.name);
        res = await fetch("/api/generate", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la soumission");
      setGen({ mode: data.mode, taskId: data.taskId });
      setPhase(data.mode === "demo" ? "Simulation démo en cours (serveur ACE-Step absent)…" : "Tâche acceptée par le serveur…");
      if (data.mode === "demo") {
        toast({ title: "Mode démo", description: "Serveur ACE-Step non détecté — génération simulée avec audios d'exemple." });
      }
      // polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch("/api/task", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: data.taskId }),
          });
          const pd = await pr.json();
          if (!pr.ok) throw new Error(pd.error || "Erreur de polling");
          setProgress(pd.progress ?? 0);
          setPhase(pd.phase ?? "");
          if (pd.tracks) setResults(pd.tracks);
          if (pd.status === 1 || pd.status === 2) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setBusy(false);
            if (pd.status === 1) toast({ title: "Génération terminée 🎵" });
            else toast({ title: "Génération échouée", variant: "destructive" });
          }
        } catch (e) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setBusy(false);
          toast({ title: "Erreur de suivi de tâche", description: e instanceof Error ? e.message : "", variant: "destructive" });
        }
      }, 1300);
    } catch (e) {
      setBusy(false);
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ---------- Actions rapides ----------
  const rollDescription = () => {
    const pool = SAMPLE_DESCRIPTIONS.filter((d) => d !== form.description);
    set("description", pool[Math.floor(Math.random() * pool.length)]);
  };
  const rollCaption = () => {
    set("caption", EXAMPLE_CAPTIONS[Math.floor(Math.random() * EXAMPLE_CAPTIONS.length)]);
  };
  const createSample = async () => {
    try {
      const r = await fetch("/api/random-sample", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_type: form.mode === "simple" ? "simple_mode" : "custom_mode" }),
      });
      const d = await r.json();
      if (d.data?.sample_query) set("description", d.data.sample_query);
      if (d.data?.caption) set("caption", d.data.caption);
      if (d.data?.lyrics) set("lyrics", d.data.lyrics);
      if (d.data?.bpm) set("bpm", String(d.data.bpm));
      if (d.data?.key_scale) set("keyScale", d.data.key_scale);
      if (d.data?.duration) { set("autoDuration", false); set("duration", Math.min(600, Number(d.data.duration))); }
      toast({ title: d.mode === "server" ? "Exemple créé par le LM" : "Exemple chargé (démo)" });
    } catch {
      toast({ title: "Impossible de créer l'exemple", variant: "destructive" });
    }
  };
  const enhanceFormat = async () => {
    try {
      setBusy(true);
      const r = await fetch("/api/format-input", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.caption, lyrics: form.lyrics, duration: form.autoDuration ? null : form.duration,
          bpm: form.bpm || null, key_scale: form.keyScale === "auto" ? null : form.keyScale,
          time_signature: form.timeSignature === "auto" ? null : form.timeSignature,
          vocal_language: form.language,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.data?.caption) set("caption", d.data.caption);
      if (d.data?.lyrics) set("lyrics", d.data.lyrics);
      toast({ title: d.mode === "server" ? "Caption & paroles améliorées par le LM" : "Amélioration simulée (démo)" });
    } catch (e) {
      toast({ title: "Format impossible", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendTrackToSrc = (t: TrackResult) => {
    if (!t.audioUrl) return;
    const name = `${t.title}.${t.audioFormat || "mp3"}`;
    setSrcUrl(t.audioUrl);
    setSrcObjUrl(t.audioUrl);
    setSrcFile(null);
    toast({ title: "Envoyé vers Audio source", description: name });
  };

  const restoreTrack = (t: TrackResult) => {
    try {
      const p = JSON.parse(t.paramsJson || "{}");
      useMuziks.getState().sendToStudio({
        mode: p.mode && MODES.some((m) => m.id === p.mode) ? p.mode : form.mode,
        description: p.sample_query ?? "",
        caption: p.prompt ?? "",
        lyrics: p.lyrics ?? t.lyrics ?? "",
        bpm: p.bpm ?? "",
        keyScale: p.key_scale ?? "auto",
        timeSignature: p.time_signature ?? "auto",
        duration: p.audio_duration ?? 60,
        autoDuration: p.audio_duration == null,
        batch: p.batch_size ?? 2,
        thinking: p.thinking ?? true,
        steps: p.inference_steps ?? 8,
        format: p.audio_format ?? "mp3",
      });
    } catch {
      toast({ title: "Paramètres illisibles", variant: "destructive" });
    }
  };

  const resultsCount = results.length;

  return (
    <div className="space-y-6">
      <SectionHead
        title="Studio de génération"
        sub={
          server.online === null
            ? "Détection du serveur ACE-Step…"
            : online
              ? "Connecté au serveur ACE-Step — les générations utilisent vos modèles locaux."
              : "Mode démo : le serveur ACE-Step (127.0.0.1:8001) est absent — les générations sont simulées avec des audios d'exemple. Lancez « uv run acestep-api » pour la vraie génération."
        }
        right={
          <Badge variant={online ? "default" : "secondary"} className={online ? "bg-green-500/15 text-green-400 border-green-500/30" : ""}>
            {server.online === null ? "…" : online ? "Serveur connecté" : "Mode démo"}
          </Badge>
        }
      />

      {/* Sélecteur de mode */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m.id];
          const active = form.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => set("mode", m.id)}
              className={cn(
                "group text-left rounded-xl border p-3 transition-all",
                active ? "border-amber-500/60 bg-amber-500/10 glow-border" : "border-border bg-card hover:border-amber-500/30 hover:bg-accent",
              )}
              aria-pressed={active}
            >
              <Icon className={cn("size-5 mb-1.5", active ? "text-amber-400" : "text-muted-foreground group-hover:text-amber-400")} />
              <div className="flex items-center gap-1.5">
                <span className={cn("text-sm font-medium", active && "text-amber-300")}>{m.label}</span>
                {m.baseOnly && <span className="text-[10px] rounded bg-secondary px-1 py-0.5 text-muted-foreground">base</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground -mt-3 flex items-start gap-1.5">
        <Info className="size-3.5 mt-0.5 shrink-0" />
        {modeDef.desc}
        {modeDef.baseOnly && " Nécessite un modèle « base » (acestep-v15-base ou xl-base) en mode réel."}
      </p>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ------- Colonne gauche : entrées ------- */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              {form.mode === "simple" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desc">Description de la chanson</Label>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={rollDescription}><Dices className="size-3.5 mr-1" /> Dé</Button>
                      <Button size="sm" variant="ghost" onClick={createSample}><Sparkles className="size-3.5 mr-1" /> Créer l&apos;exemple</Button>
                    </div>
                  </div>
                  <Textarea
                    id="desc"
                    placeholder="ex. une chanson d'amour douce en français pour une soirée tranquille"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le LM 5Hz développe votre description en caption complète, paroles et méta-données (CoT), puis le DiT génère l&apos;audio.
                  </p>
                </div>
              )}

              {form.mode !== "simple" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption (description musicale)</Label>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={rollCaption}><Dices className="size-3.5 mr-1" /> Dé</Button>
                      <Button size="sm" variant="ghost" onClick={enhanceFormat} disabled={busy}>
                        <Sparkles className="size-3.5 mr-1" /> Format LM
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="ex. upbeat pop rock with electric guitars, driving drums, and catchy synth hooks"
                    value={form.caption}
                    onChange={(e) => set("caption", e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {["custom", "remix", "repaint", "lego", "complete"].includes(form.mode) && (
                <div className="space-y-2">
                  <Label htmlFor="lyrics">Paroles (balises de structure)</Label>
                  <Textarea
                    id="lyrics"
                    placeholder={"[Verse 1]\nParoles…\n\n[Chorus]\nRefrain…"}
                    value={form.lyrics}
                    onChange={(e) => set("lyrics", e.target.value)}
                    rows={5}
                    className="font-mono text-[13px]"
                  />
                </div>
              )}

              {form.mode === "extract" && (
                <div className="space-y-2">
                  <Label>Piste à extraire</Label>
                  <Select value={form.trackName} onValueChange={(v) => set("trackName", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRACK_NAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.mode === "lego" && (
                <div className="space-y-2">
                  <Label>Piste à ajouter</Label>
                  <Select value={form.trackName} onValueChange={(v) => set("trackName", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRACK_NAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.mode === "complete" && (
                <div className="space-y-2">
                  <Label>Pistes à compléter (auto-arrangement)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TRACK_NAMES.map((t) => {
                      const on = form.trackNames.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            set("trackNames", on ? form.trackNames.filter((x) => x !== t) : [...form.trackNames, t])
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            on ? "border-amber-500/60 bg-amber-500/15 text-amber-300" : "border-border text-muted-foreground hover:border-amber-500/30",
                          )}
                          aria-pressed={on}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.mode === "repaint" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rs">Début (s)</Label>
                    <Input id="rs" type="number" min={0} value={form.repaintStart} onChange={(e) => set("repaintStart", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="re">Fin (s, -1 = fin)</Label>
                    <Input id="re" type="number" min={-1} value={form.repaintEnd} onChange={(e) => set("repaintEnd", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Masque</Label>
                    <Select value={form.maskMode} onValueChange={(v) => set("maskMode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">auto</SelectItem>
                        <SelectItem value="explicit">explicit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {["remix", "v2bgm"].includes(form.mode) && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label>Force du cover / transfert : {form.coverStrength.toFixed(2)}</Label>
                    <span className="text-xs text-muted-foreground">0.2 = style libre · 1.0 = proche de l&apos;original</span>
                  </div>
                  <Slider value={[form.coverStrength]} min={0} max={1} step={0.05} onValueChange={([v]) => set("coverStrength", v)} />
                </div>
              )}

              {needsSrc && (
                <div className="space-y-2 rounded-lg border border-dashed p-3.5">
                  <Label className="flex items-center gap-1.5"><FileAudio2 className="size-4 text-amber-400" /> Audio source (obligatoire)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="audio/*" className="sr-only" onChange={(e) => pickSrc(e.target.files?.[0] ?? null)} />
                      <span className="inline-flex h-9 items-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/80">
                        Choisir un fichier
                      </span>
                    </label>
                    <Input
                      placeholder="…ou coller une URL (ex. /api/file?name=… ou /demo/…)"
                      value={srcUrl}
                      onChange={(e) => {
                        setSrcUrl(e.target.value);
                        setSrcObjUrl(e.target.value);
                        setSrcFile(null);
                      }}
                      className="flex-1 min-w-56"
                    />
                  </div>
                  {srcObjUrl && (
                    <audio controls src={srcObjUrl} className="w-full mt-1 h-9" preload="metadata" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    En mode réel, le fichier est envoyé au serveur (multipart). Utilisez « → Source » depuis un résultat pour chaîner les générations.
                  </p>
                </div>
              )}

              {form.mode === "custom" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><FileAudio2 className="size-4 text-amber-400" /> Audio de référence (style, optionnel)</Label>
                  <label className="cursor-pointer block">
                    <input type="file" accept="audio/*" className="sr-only" onChange={(e) => setRefFile(e.target.files?.[0] ?? null)} />
                    <span className="inline-flex h-9 items-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/80">
                      {refFile ? refFile.name : "Choisir un fichier"}
                    </span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Méta-données */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Contrôle des méta-données</h3>
                <span className="text-xs text-muted-foreground">Laissez en « auto » pour laisser le LM décider</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bpm">BPM (30–300)</Label>
                  <Input id="bpm" type="number" min={30} max={300} placeholder="auto" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tonalité</Label>
                  <Select value={form.keyScale} onValueChange={(v) => set("keyScale", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="auto">Auto</SelectItem>
                      {KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mesure</Label>
                  <Select value={form.timeSignature} onValueChange={(v) => set("timeSignature", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      {TIME_SIGNATURES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Langue du chant</Label>
                  <Select value={form.language} onValueChange={(v) => set("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {VOCAL_LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Durée : {form.autoDuration ? "auto" : `${form.duration} s`}</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Auto</span>
                      <Switch checked={form.autoDuration} onCheckedChange={(v) => set("autoDuration", v)} aria-label="Durée automatique" />
                    </div>
                  </div>
                  <Slider
                    value={[form.duration]} min={10} max={600} step={5}
                    disabled={form.autoDuration}
                    onValueChange={([v]) => set("duration", v)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Lot (batch) : {form.batch} piste{form.batch > 1 ? "s" : ""}</Label>
                    <span className="text-xs text-muted-foreground">max 8</span>
                  </div>
                  <Slider value={[form.batch]} min={1} max={8} step={1} onValueChange={([v]) => set("batch", v)} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch id="instr" checked={form.instrumental} onCheckedChange={(v) => set("instrumental", v)} />
                  <Label htmlFor="instr">Instrumental</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="think" checked={form.thinking} onCheckedChange={(v) => set("thinking", v)} />
                  <Label htmlFor="think" className="flex items-center gap-1">Think (LM) <span className="text-[10px] text-muted-foreground">(ignoré en cover/repaint/extract)</span></Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="usefmt" checked={form.useFormat} onCheckedChange={(v) => set("useFormat", v)} />
                  <Label htmlFor="usefmt">Améliorer l&apos;entrée (use_format)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Réglages avancés */}
          <Accordion type="single" collapsible>
            <AccordionItem value="adv" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Réglages avancés (DiT · LM · Seed)
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <Tabs defaultValue="dit">
                  <TabsList className="mb-3">
                    <TabsTrigger value="dit">Diffusion (DiT)</TabsTrigger>
                    <TabsTrigger value="lm">LM 5Hz</TabsTrigger>
                    <TabsTrigger value="out">Sortie</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dit" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label>Steps : {form.steps}</Label>
                        <Slider value={[form.steps]} min={1} max={200} step={1} onValueChange={([v]) => set("steps", v)} />
                        <p className="text-[10px] text-muted-foreground">turbo : 8 · base : 32–64</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Guidance CFG : {form.guidance}</Label>
                        <Slider value={[form.guidance]} min={0} max={15} step={0.5} onValueChange={([v]) => set("guidance", v)} />
                        <p className="text-[10px] text-muted-foreground">modèles base uniquement</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Shift : {form.shift}</Label>
                        <Slider value={[form.shift]} min={1} max={5} step={0.1} onValueChange={([v]) => set("shift", v)} />
                        <p className="text-[10px] text-muted-foreground">base uniquement</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Méthode</Label>
                        <Select value={form.method} onValueChange={(v) => set("method", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ode">ode (Euler, rapide)</SelectItem>
                            <SelectItem value="sde">sde (stochastique)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="ts">Timesteps personnalisés (ex. 0.97,0.76,…)</Label>
                        <Input id="ts" value={form.timesteps} onChange={(e) => set("timesteps", e.target.value)} placeholder="— override steps & shift" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CFG start : {form.cfgStart.toFixed(2)}</Label>
                        <Slider value={[form.cfgStart]} min={0} max={1} step={0.05} onValueChange={([v]) => set("cfgStart", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CFG end : {form.cfgEnd.toFixed(2)}</Label>
                        <Slider value={[form.cfgEnd]} min={0} max={1} step={0.05} onValueChange={([v]) => set("cfgEnd", v)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch id="adg" checked={form.adg} onCheckedChange={(v) => set("adg", v)} />
                        <Label htmlFor="adg">ADG (base)</Label>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="lm" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1.5">
                        <Label>Temp : {form.lmTemp}</Label>
                        <Slider value={[form.lmTemp]} min={0} max={2} step={0.05} onValueChange={([v]) => set("lmTemp", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CFG LM : {form.lmCfg}</Label>
                        <Slider value={[form.lmCfg]} min={1} max={3} step={0.1} onValueChange={([v]) => set("lmCfg", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Top-P : {form.lmTopP}</Label>
                        <Slider value={[form.lmTopP]} min={0} max={1} step={0.05} onValueChange={([v]) => set("lmTopP", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Top-K</Label>
                        <Input type="number" min={0} value={form.lmTopK} onChange={(e) => set("lmTopK", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Rep. penalty</Label>
                        <Input type="number" min={1} max={2} step={0.05} value={form.lmRep} onChange={(e) => set("lmRep", Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch id="cotc" checked={form.cotCaption} onCheckedChange={(v) => set("cotCaption", v)} />
                        <Label htmlFor="cotc">CoT caption (réécriture)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="cotl" checked={form.cotLanguage} onCheckedChange={(v) => set("cotLanguage", v)} />
                        <Label htmlFor="cotl">CoT langue</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="cons" checked={form.constrained} onCheckedChange={(v) => set("constrained", v)} />
                        <Label htmlFor="cons">Decoding contraint</Label>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="out" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label>Format audio</Label>
                        <Select value={form.format} onValueChange={(v) => set("format", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {AUDIO_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Seed</Label>
                        <Input
                          value={form.randomSeed ? "(aléatoire)" : form.seed}
                          disabled={form.randomSeed}
                          onChange={(e) => set("seed", e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch id="rseed" checked={form.randomSeed} onCheckedChange={(v) => set("randomSeed", v)} />
                        <Label htmlFor="rseed">Seed aléatoire</Label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Bouton générer */}
          <div className="flex items-center gap-3">
            <Button size="lg" className="flex-1 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="size-5 mr-2 animate-spin" /> : <Music4 className="size-5 mr-2" />}
              {busy ? "Génération en cours…" : "Générer la musique"}
            </Button>
            <Button
              size="lg" variant="ghost"
              onClick={() => { setForm(INITIAL); setResults([]); setGen(null); setSrcFile(null); setSrcObjUrl(""); setSrcUrl(""); setRefFile(null); }}
            >
              <RotateCcw className="size-4 mr-1" /> Réinitialiser
            </Button>
          </div>
        </div>

        {/* ------- Colonne droite : progression & résultats ------- */}
        <div className="lg:col-span-2 space-y-4">
          {(busy || gen) && (
            <Card className={cn(busy && "glow-border")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    {busy && <Loader2 className="size-4 animate-spin text-amber-400" />}
                    Tâche {gen?.mode === "demo" ? "démo" : "serveur"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-40">{gen?.taskId}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{phase} — {Math.round(progress)}%</p>
              </CardContent>
            </Card>
          )}

          {resultsCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Résultats ({results.filter((r) => r.status === 1).length}/{resultsCount})</h3>
                <Badge variant="secondary">{modeDef.label}</Badge>
              </div>
              {results.map((t) => (
                <ResultCard
                  key={t.id}
                  track={t}
                  onPlay={() => {
                    const pt: PlayerTrack = {
                      id: t.id, title: t.title, url: t.audioUrl || "",
                      prompt: t.prompt, bpm: t.bpm, keyScale: t.keyScale,
                      duration: t.duration,
                    };
                    if (t.audioUrl) useMuziks.getState().play(pt);
                  }}
                  onSendSrc={() => sendTrackToSrc(t)}
                  onRestore={() => restoreTrack(t)}
                />
              ))}
            </div>
          )}

          {!busy && resultsCount === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-2">
                <Music4 className="size-8 mx-auto text-amber-500/50" />
                <p className="font-medium text-foreground">Aucun résultat pour l&apos;instant</p>
                <p>
                  Astuces : gardez <b>Think</b> activé pour la meilleure qualité, générez un lot de 2–4 variantes,
                  puis utilisez <b>→ Source</b> pour chaîner Remix → Repaint.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  track: t, onPlay, onSendSrc, onRestore,
}: {
  track: TrackResult;
  onPlay: () => void;
  onSendSrc: () => void;
  onRestore: () => void;
}) {
  const { current, isPlaying, play } = useMuziks();
  const playingThis = current?.id === t.id && isPlaying;
  const [showLrc, setShowLrc] = useState(false);

  const download = () => {
    if (!t.audioUrl) return;
    const a = document.createElement("a");
    a.href = t.audioUrl;
    a.download = `${t.title.replace(/[^\w\-À-ÿ ]+/g, "")}.${t.audioFormat === "wav32" ? "wav" : t.audioFormat || "mp3"}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  };

  return (
    <Card className={cn(t.status === 2 && "border-red-500/40")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t.title}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <StatusBadge status={(t.status as 0 | 1 | 2)} />
              {t.bpm != null && <Badge variant="secondary" className="text-[10px]">{t.bpm} BPM</Badge>}
              {t.keyScale && <Badge variant="secondary" className="text-[10px]">{t.keyScale}</Badge>}
              {t.timeSignature && <Badge variant="secondary" className="text-[10px]">{t.timeSignature}/4</Badge>}
              {t.duration != null && <Badge variant="secondary" className="text-[10px]">{Math.round(t.duration)}s</Badge>}
              {t.seed && <Badge variant="secondary" className="text-[10px]">seed {t.seed}</Badge>}
            </div>
          </div>
          {t.status === 1 && (
            <Button size="icon" variant="secondary" className="size-9 rounded-full shrink-0" onClick={onPlay} aria-label={playingThis ? "Lecture en cours" : "Lecture"}>
              <Play className={cn("size-4", playingThis && "text-amber-400")} />
            </Button>
          )}
        </div>
        {t.status === 2 && t.error && (
          <p className="text-xs text-red-400">{t.error}</p>
        )}
        {t.status === 1 && t.score != null && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Gauge className="size-3.5 text-amber-400" /> Score qualité : <b className="text-foreground">{t.score.toFixed(3)}</b> (perplexité)
          </p>
        )}
        {t.status === 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={download}><Download className="size-3.5 mr-1" /> Télécharger</Button>
            <Button size="sm" variant="ghost" onClick={onSendSrc}><SendToBack className="size-3.5 mr-1" /> → Source</Button>
            <Button size="sm" variant="ghost" onClick={onRestore}><RotateCcw className="size-3.5 mr-1" /> Réutiliser</Button>
            {t.lrc && (
              <Button size="sm" variant="ghost" onClick={() => setShowLrc((s) => !s)}>
                <FileText className="size-3.5 mr-1" /> LRC
              </Button>
            )}
          </div>
        )}
        {showLrc && t.lrc && (
          <div className="relative">
            <pre className="rounded-md bg-black/40 p-3 text-[11.5px] font-mono max-h-40 overflow-auto whitespace-pre-wrap">{t.lrc}</pre>
            <Button
              size="icon" variant="ghost" className="absolute top-1 right-1 size-6"
              onClick={() => navigator.clipboard?.writeText(t.lrc || "")} aria-label="Copier le LRC"
            >
              <Copy className="size-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

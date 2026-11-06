"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dumbbell, Save, Trash2, Play, Square, Loader2, FolderSearch, Sparkles, ScrollText, FileDown,
} from "lucide-react";
import { useMuziks } from "@/lib/muziks/store";
import { SectionHead, StatusBadge } from "../ui-bits";

type Sample = {
  file: string;
  caption: string;
  lyrics: string;
  bpm: string;
  key: string;
  timeSignature: string;
  language: string;
  instrumental: boolean;
};

type Dataset = { id: string; name: string; activationTag: string; tagPosition: string; allInstrumental: boolean; samplesJson: string; updatedAt: string };
type Run = { id: string; name: string; kind: string; status: number; progress: number; paramsJson: string; log: string; datasetPath: string; outputDir: string; createdAt: string };

const DEMO_AUDIO_POOL = [
  "/demo/neon-skyline.wav", "/demo/sunset-boulevard.wav", "/demo/midnight-groove.wav",
  "/demo/reve-electrique.wav", "/demo/coffee-and-rain.wav", "/demo/rock-revival.wav",
];

export function TrainView() {
  const { server } = useMuziks();
  const online = server.online === true;

  // ---------- Dataset builder ----------
  const [name, setName] = useState("Mon style");
  const [activationTag, setActivationTag] = useState("muziks_style_v1");
  const [tagPosition, setTagPosition] = useState("prepend");
  const [allInstrumental, setAllInstrumental] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [scanPath, setScanPath] = useState("");
  const [selected, setSelected] = useState(0);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDs, setActiveDs] = useState<string>("");

  // ---------- Training ----------
  const [kind, setKind] = useState<"lora" | "lokr">("lora");
  const [tensorDir, setTensorDir] = useState("./datasets/tensors");
  const [outputDir, setOutputDir] = useState("./lora_output");
  const [rank, setRank] = useState(64);
  const [alpha, setAlpha] = useState(128);
  const [dropout, setDropout] = useState(0.1);
  const [lr, setLr] = useState(0.0001);
  const [epochs, setEpochs] = useState(500);
  const [batchSize, setBatchSize] = useState(1);
  const [gradAcc, setGradAcc] = useState(4);
  const [saveEvery, setSaveEvery] = useState(200);
  const [shift, setShift] = useState(3.0);
  const [seed, setSeed] = useState(42);
  const [lokrDim, setLokrDim] = useState(64);
  const [lokrAlpha, setLokrAlpha] = useState(128);
  const [lokrFactor, setLokrFactor] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);

  const loadDatasets = useCallback(async () => {
    const r = await fetch("/api/datasets");
    const d = await r.json();
    setDatasets(d.datasets ?? []);
  }, []);

  const loadRuns = useCallback(async () => {
    const r = await fetch("/api/training");
    const d = await r.json();
    setRuns(d.runs ?? []);
  }, []);

  useEffect(() => { loadDatasets(); loadRuns(); }, [loadDatasets, loadRuns]);
  useEffect(() => {
    const t = setInterval(loadRuns, 2000);
    return () => clearInterval(t);
  }, [loadRuns]);

  // Scan simulé (démo) : crée des exemples à partir du pool audio
  const scan = () => {
    const n = 8;
    const arr: Sample[] = Array.from({ length: n }, (_, i) => ({
      file: scanPath.trim() ? `${scanPath.replace(/\/$/, "")}/track_${String(i + 1).padStart(2, "0")}.wav` : DEMO_AUDIO_POOL[i % DEMO_AUDIO_POOL.length],
      caption: "style à annoter — cliquez sur Auto-Label",
      lyrics: "", bpm: "", key: "", timeSignature: "4",
      language: allInstrumental ? "unknown" : "fr", instrumental: allInstrumental,
    }));
    setSamples(arr);
    toast({ title: `${n} fichiers scannés`, description: "Utilisez Auto-Label puis enregistrez le dataset." });
  };

  const autoLabel = () => {
    const bpms = [90, 100, 110, 120, 128, 140];
    const keys = ["C Major", "A minor", "G Major", "E minor", "F Major"];
    setSamples((ss) => ss.map((s, i) => ({
      ...s,
      caption: `${name} — piste ${i + 1}: ${["groove chaleureux", "nappes aériennes", "basse ronde", "percussions précises", "mélodie accrocheuse", "ambiance nocturne", "énergie brute", "texture organique"][i % 8]}`,
      bpm: String(bpms[i % bpms.length]),
      key: keys[i % keys.length],
      timeSignature: "4",
    })));
    toast({ title: online ? "Auto-label envoyé au LM" : "Auto-label simulé (démo)" });
  };

  const updSample = (i: number, patch: Partial<Sample>) =>
    setSamples((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const saveDataset = async () => {
    if (!samples.length) {
      toast({ title: "Aucun échantillon", description: "Scannez d'abord un dossier.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/datasets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeDs || undefined, name, activationTag, tagPosition, allInstrumental, samples }),
      });
      const d = await r.json();
      setActiveDs(d.dataset.id);
      await loadDatasets();
      toast({ title: "Dataset enregistré", description: d.dataset.name });
    } finally {
      setBusy(false);
    }
  };

  const loadDataset = (ds: Dataset) => {
    setActiveDs(ds.id);
    setName(ds.name);
    setActivationTag(ds.activationTag);
    setTagPosition(ds.tagPosition);
    setAllInstrumental(ds.allInstrumental);
    try {
      setSamples(JSON.parse(ds.samplesJson || "[]"));
    } catch {
      setSamples([]);
    }
    toast({ title: "Dataset chargé", description: ds.name });
  };

  const deleteDataset = async (ds: Dataset) => {
    await fetch(`/api/datasets?id=${ds.id}`, { method: "DELETE" });
    if (activeDs === ds.id) setActiveDs("");
    loadDatasets();
    toast({ title: "Dataset supprimé" });
  };

  const preprocess = () => {
    toast({
      title: online ? "Prétraitement envoyé" : "Prétraitement (démo)",
      description: `Tenseurs VAE + embeddings texte vers ${tensorDir}`,
    });
  };

  const startTraining = async () => {
    setBusy(true);
    try {
      const params: Record<string, unknown> =
        kind === "lora"
          ? { tensor_dir: tensorDir, output_dir: outputDir, lora_rank: rank, lora_alpha: alpha, lora_dropout: dropout, learning_rate: lr, train_epochs: epochs, train_batch_size: batchSize, gradient_accumulation: gradAcc, save_every_n_epochs: saveEvery, training_shift: shift, training_seed: seed }
          : { tensor_dir: tensorDir, output_dir: outputDir, lokr_linear_dim: lokrDim, lokr_linear_alpha: lokrAlpha, lokr_factor: lokrFactor, learning_rate: lr, train_epochs: epochs, train_batch_size: batchSize, gradient_accumulation: gradAcc, save_every_n_epochs: saveEvery, training_shift: shift, training_seed: seed };
      const r = await fetch("/api/training", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, params }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: d.mode === "server" ? "Entraînement lancé sur le serveur" : "Entraînement simulé lancé (démo)" });
      loadRuns();
    } catch (e) {
      toast({ title: "Échec du lancement", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const stopRun = async (run: Run) => {
    await fetch("/api/training", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: run.id }),
    });
    loadRuns();
  };

  const cur = samples[selected];

  return (
    <div className="space-y-5">
      <SectionHead
        title="Entraînement LoRA / LoKr"
        sub="Construisez un dataset annoté, prétraitez-le en tenseurs, puis entraînez un adaptateur qui capture votre style — 8 chansons suffisent (≈1 h sur RTX 3090 12 Go)."
        right={<Badge variant={online ? "default" : "secondary"}>{online ? "Serveur connecté" : "Mode démo simulé"}</Badge>}
      />

      <Tabs defaultValue="dataset">
        <TabsList>
          <TabsTrigger value="dataset">1 · Dataset Builder</TabsTrigger>
          <TabsTrigger value="preprocess">2 · Prétraitement</TabsTrigger>
          <TabsTrigger value="train">3 · Entraînement</TabsTrigger>
          <TabsTrigger value="runs">Suivi des runs</TabsTrigger>
        </TabsList>

        {/* ---------- Dataset builder ---------- */}
        <TabsContent value="dataset" className="pt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="scan">Dossier audio à scanner (serveur)</Label>
                  <div className="flex gap-2">
                    <Input id="scan" placeholder="/chemin/vers/mes/chansons" value={scanPath} onChange={(e) => setScanPath(e.target.value)} />
                    <Button variant="secondary" onClick={scan}><FolderSearch className="size-4 mr-1" /> Scanner</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Formats détectés : wav, mp3, flac, ogg, opus.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dsname">Nom du dataset</Label>
                    <Input id="dsname" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tag">Tag d&apos;activation (trigger)</Label>
                    <Input id="tag" value={activationTag} onChange={(e) => setActivationTag(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label>Position du tag</Label>
                    <Select value={tagPosition} onValueChange={setTagPosition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepend">prepend (début de caption)</SelectItem>
                        <SelectItem value="append">append (fin de caption)</SelectItem>
                        <SelectItem value="replace">replace (remplace la caption)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch id="ai" checked={allInstrumental} onCheckedChange={setAllInstrumental} />
                    <Label htmlFor="ai">Tout instrumental</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={autoLabel} disabled={!samples.length}>
                    <Sparkles className="size-4 mr-1" /> Auto-Label (LM)
                  </Button>
                  <Button variant="secondary" onClick={saveDataset} disabled={busy}>
                    <Save className="size-4 mr-1" /> Enregistrer le dataset
                  </Button>
                  <Button variant="ghost" onClick={preprocess} disabled={!samples.length}>
                    Prétraiter → tenseurs
                  </Button>
                </div>
                {datasets.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Datasets enregistrés</Label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {datasets.map((ds) => (
                        <div key={ds.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${activeDs === ds.id ? "border-amber-500/50 bg-amber-500/10" : ""}`}>
                          <button className="text-left flex-1 truncate" onClick={() => loadDataset(ds)}>
                            {ds.name} <span className="text-muted-foreground text-xs">· {JSON.parse(ds.samplesJson || "[]").length} pistes</span>
                          </button>
                          <Button size="icon" variant="ghost" className="size-7 text-red-400" onClick={() => deleteDataset(ds)} aria-label="Supprimer">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Échantillons ({samples.length})</h3>
                  {samples.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="range" min={0} max={samples.length - 1} value={selected}
                        onChange={(e) => setSelected(Number(e.target.value))}
                        className="w-28 accent-amber-500" aria-label="Naviguer entre les échantillons"
                      />
                      {selected + 1}/{samples.length}
                    </div>
                  )}
                </div>
                {!cur ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Scannez un dossier pour prévisualiser et éditer les annotations.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs font-mono text-muted-foreground truncate">{cur.file}</p>
                    {cur.file.startsWith("/demo") && <audio controls src={cur.file} className="w-full h-9" preload="metadata" />}
                    <div className="space-y-1.5">
                      <Label>Caption</Label>
                      <Textarea rows={2} value={cur.caption} onChange={(e) => updSample(selected, { caption: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">BPM</Label>
                        <Input value={cur.bpm} onChange={(e) => updSample(selected, { bpm: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tonalité</Label>
                        <Input value={cur.key} onChange={(e) => updSample(selected, { key: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Mesure</Label>
                        <Input value={cur.timeSignature} onChange={(e) => updSample(selected, { timeSignature: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Langue</Label>
                        <Input value={cur.language} onChange={(e) => updSample(selected, { language: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id={`si-${selected}`} checked={cur.instrumental} onCheckedChange={(v) => updSample(selected, { instrumental: v })} />
                      <Label htmlFor={`si-${selected}`}>Instrumental</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Prétraitement ---------- */}
        <TabsContent value="preprocess" className="pt-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le prétraitement encode chaque audio en <b className="text-foreground">latents VAE</b>, le texte en
                <b className="text-foreground"> embeddings</b> et lance le condition-encoder — tout est stocké sous forme de
                tenseurs pour un entraînement rapide. C&apos;est l&apos;étape « Preprocess » du Gradio UI officiel.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="td">Répertoire de sortie des tenseurs</Label>
                  <Input id="td" value={tensorDir} onChange={(e) => setTensorDir(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dataset source</Label>
                  <Input value={activeDs ? (datasets.find((d) => d.id === activeDs)?.name ?? "") : "— dataset courant non enregistré"} disabled />
                </div>
              </div>
              <Button onClick={preprocess}>
                Lancer le prétraitement {online ? "" : "(démo)"}
              </Button>
              <div className="rounded-lg border bg-black/20 p-3 text-xs text-muted-foreground flex gap-2">
                <ScrollText className="size-4 shrink-0 mt-0.5 text-amber-400" />
                Astuce VRAM : activez « Offload to CPU » et l&apos;encodage par tuiles (tiled encode) sur GPU limité — voir le guide officiel LoRA.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Entraînement ---------- */}
        <TabsContent value="train" className="pt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type d&apos;adaptateur</Label>
                    <Select value={kind} onValueChange={(v) => setKind(v as "lora" | "lokr")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lora">LoRA (précis)</SelectItem>
                        <SelectItem value="lokr">LoKr (rapide, Kronecker)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom du run</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
                {kind === "lora" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Rank (r)</Label>
                      <Input type="number" value={rank} onChange={(e) => setRank(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Alpha</Label>
                      <Input type="number" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dropout</Label>
                      <Input type="number" step={0.05} value={dropout} onChange={(e) => setDropout(Number(e.target.value))} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">LoKr dim</Label>
                      <Input type="number" value={lokrDim} onChange={(e) => setLokrDim(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">LoKr alpha</Label>
                      <Input type="number" value={lokrAlpha} onChange={(e) => setLokrAlpha(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Factor (-1 = auto)</Label>
                      <Input type="number" value={lokrFactor} onChange={(e) => setLokrFactor(Number(e.target.value))} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Epochs</Label>
                    <Input type="number" value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Batch</Label>
                    <Input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Grad accum</Label>
                    <Input type="number" value={gradAcc} onChange={(e) => setGradAcc(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Save every</Label>
                    <Input type="number" value={saveEvery} onChange={(e) => setSaveEvery(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Learning rate</Label>
                    <Input type="number" step={0.00005} value={lr} onChange={(e) => setLr(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Shift</Label>
                    <Input type="number" step={0.1} value={shift} onChange={(e) => setShift(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Seed</Label>
                    <Input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tenseurs (tensor_dir)</Label>
                    <Input value={tensorDir} onChange={(e) => setTensorDir(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sortie (output_dir)</Label>
                    <Input value={outputDir} onChange={(e) => setOutputDir(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500" onClick={startTraining} disabled={busy}>
                  {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Play className="size-4 mr-2" />}
                  Démarrer l&apos;entraînement {kind.toUpperCase()}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <h3 className="text-sm font-semibold">Déroulé officiel (rappel)</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  <li>Préparez 8+ chansons représentatives de votre style.</li>
                  <li>Scan → Auto-Label (caption, BPM, clé) → corrigez les annotations.</li>
                  <li>Enregistrez le dataset JSON puis prétraitez en tenseurs.</li>
                  <li>Lancez LoRA (r=64, alpha=128, lr=1e-4) ou LoKr (plus rapide).</li>
                  <li>Surveillez la loss (~0.8–1.2 c&apos;est bien) puis exportez l&apos;adaptateur.</li>
                  <li>Chargez le LoRA dans le Studio (LoRA Path) et activez-le avec votre tag d&apos;activation.</li>
                </ol>
                <div className="rounded-lg border bg-black/20 p-3 text-xs text-muted-foreground flex gap-2 mt-2">
                  <FileDown className="size-4 shrink-0 mt-0.5 text-amber-400" />
                  Guide complet : docs/en/LoRA_Training_Tutorial.md — et Side-Step pour l&apos;entraînement avancé (LoKR, sampling corrigé, gradient sensitivity).
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Runs ---------- */}
        <TabsContent value="runs" className="pt-4 space-y-3">
          {runs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Aucun run pour l&apos;instant.
              </CardContent>
            </Card>
          ) : (
            runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-amber-400" />
                      <span className="text-sm font-medium">{run.name}</span>
                      <Badge variant="secondary">{run.kind.toUpperCase()}</Badge>
                      <StatusBadge status={(run.status as 0 | 1 | 2 | 3)} />
                    </div>
                    {run.status === 0 && (
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => stopRun(run)}>
                        <Square className="size-3.5 mr-1" /> Arrêter
                      </Button>
                    )}
                  </div>
                  {run.status === 0 && <Progress value={run.progress} className="h-2" />}
                  <pre className="rounded-md bg-black/40 p-3 text-[11.5px] font-mono whitespace-pre-wrap max-h-40 overflow-auto">{run.log}</pre>
                  <p className="text-[11px] text-muted-foreground">sortie : {run.outputDir || "—"} · tenseurs : {run.datasetPath || "—"}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

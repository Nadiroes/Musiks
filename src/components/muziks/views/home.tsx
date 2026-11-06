"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music4, Zap, Timer, Layers, Languages, Split, Paintbrush, Shuffle,
  Blocks, MicVocal, Gauge, Dumbbell, FileAudio2, ArrowRight, Github,
  ExternalLink, SlidersHorizontal, ListMusic,
} from "lucide-react";
import { useMuziks } from "@/lib/muziks/store";
import { ExtLink } from "../ui-bits";
import { LINKS } from "@/lib/muziks/constants";

const FEATURES = [
  { icon: Zap, title: "Ultra-rapide", desc: "Moins de 2 s par chanson complète sur A100, moins de 10 s sur RTX 3090 (0.5–10 s selon Think & steps)." },
  { icon: Timer, title: "Durée flexible", desc: "De 10 secondes à 10 minutes (600 s) d'audio généré." },
  { icon: Layers, title: "Lot jusqu'à 8", desc: "Générez jusqu'à 8 variantes simultanément et gardez la meilleure." },
  { icon: Music4, title: "Qualité commerciale", desc: "Niveau entre Suno v4.5 et v5 — plus de 1 000 instruments et styles." },
  { icon: Languages, title: "50+ langues", desc: "Paroles multi-langues avec contrôle de structure et de style." },
  { icon: FileAudio2, title: "Audio de référence", desc: "Guidez la génération avec un audio de style (transfert de timbre)." },
  { icon: Shuffle, title: "Remix / Cover", desc: "Transformez un morceau existant dans un nouveau style, structure conservée." },
  { icon: Paintbrush, title: "Repaint & édition", desc: "Régénérez un segment précis, le reste du morceau reste intact." },
  { icon: Split, title: "Séparation de pistes", desc: "Extrayez voix, batterie, basse, guitare… (mode extract, modèle base)." },
  { icon: Blocks, title: "Lego (Add Layer)", desc: "Ajoutez des couches d'instruments comme Suno Studio." },
  { icon: ListMusic, title: "Complete", desc: "Arrangement automatique : complétez une maquette avec plusieurs instruments." },
  { icon: MicVocal, title: "Vocal2BGM", desc: "Générez l'accompagnement instrumental d'une piste vocale." },
  { icon: SlidersHorizontal, title: "Méta-données", desc: "Contrôlez BPM, tonalité, mesure et durée (ou laissez le LM décider)." },
  { icon: Gauge, title: "Score & LRC", desc: "Évaluation automatique de qualité et timestamps de paroles (LRC)." },
  { icon: Dumbbell, title: "LoRA training", desc: "8 chansons, 1 heure sur RTX 3090 (12 Go) pour capturer votre style." },
];

export function HomeView() {
  const setView = useMuziks((s) => s.setView);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="hero-gradient rounded-2xl border overflow-hidden">
        <div className="px-6 py-14 sm:px-12 sm:py-20 text-center max-w-3xl mx-auto space-y-6">
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-300 border-amber-500/30">
            Propulsé par ACE-Step 1.5 — open source (MIT)
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Créez de la musique
            <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              à partir de mots.
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Muziks est le studio web complet construit sur ACE-Step 1.5 : Text2Music, remix,
            repaint, séparation de pistes, multi-couches, LoRA training et analyse audio —
            sur votre propre machine, sans GPU serveur coûteux.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500" onClick={() => setView("studio")}>
              <Music4 className="size-5 mr-2" /> Ouvrir le Studio
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setView("setup")}>
              Installer ACE-Step <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer">
                <Github className="size-4 mr-2" /> GitHub 14.2k★
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: "< 2 s", l: "par chanson sur A100" },
          { v: "10 s – 10 min", l: "durée générée" },
          { v: "50+", l: "langues de paroles" },
          { v: "< 4 Go", l: "de VRAM suffisante" },
        ].map((s) => (
          <Card key={s.l}>
            <CardContent className="p-5 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-amber-400">{s.v}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.l}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Fonctionnalités */}
      <section>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Toutes les fonctionnalités, dans un seul studio</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chaque capacité d&apos;ACE-Step 1.5 est exposée dans Muziks — du mode Simple au LoRA training.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setView("studio")}>
            Essayer <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="hover:border-amber-500/30 transition-colors">
              <CardContent className="p-4 flex gap-3">
                <f.icon className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="size-5 text-amber-400" /> Architecture hybride LM + DiT</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le <b className="text-foreground">Language Model 5Hz</b> agit en planificateur omni-capable : il transforme une simple
              requête en plan de chanson complet (méta-données, paroles, caption) par Chain-of-Thought,
              puis le <b className="text-foreground">Diffusion Transformer (DiT)</b> synthétise l&apos;audio. L&apos;alignement est obtenu par
              renforcement intrinsèque — sans biais de modèles de récompense externes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Zap className="size-5 text-amber-400" /> Tourne partout, localement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CUDA, Apple Silicon (MLX), AMD ROCm, Intel XPU et CPU. À partir de 4 Go de VRAM avec
              quantification INT8 et offload CPU. Interface auto-adaptative selon votre GPU.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["CUDA", "MLX (Mac)", "ROCm (AMD)", "Intel XPU", "CPU"].map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Liens écosystème */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-5">Écosystème & liens officiels</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: LINKS.acemusic, title: "acemusic.ai", desc: "Démo hébergée 100 % gratuite, sans GPU" },
            { href: LINKS.huggingface, title: "Hugging Face", desc: "Modèles DiT & LM 5Hz officiels" },
            { href: LINKS.modelscope, title: "ModelScope", desc: "Miroir des checkpoints" },
            { href: LINKS.spaceDemo, title: "Space Demo", desc: "Démo interactive HF Spaces" },
            { href: LINKS.discord, title: "Discord", desc: "Communauté & support" },
            { href: LINKS.technicalReport, title: "Rapport technique", desc: "Architecture & benchmarks" },
            { href: LINKS.awesome, title: "Awesome ACE-Step", desc: "Projets communautaires, ComfyUI, clouds" },
            { href: LINKS.vst3, title: "Plugin VST3", desc: "Intégration DAW (C++/GGML)" },
          ].map((l) => (
            <a key={l.title} href={l.href} target="_blank" rel="noopener noreferrer" className="group">
              <Card className="h-full group-hover:border-amber-500/40 transition-colors">
                <CardContent className="p-4">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {l.title} <ExternalLink className="size-3.5 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Projet co-ledigé par ACE Studio et StepFun · Licence MIT ·{" "}
          <ExtLink href={LINKS.docs.tutorial}>Tutoriel officiel</ExtLink> ·{" "}
          <ExtLink href={LINKS.sidestep}>Side-Step (entraînement avancé)</ExtLink>
        </p>
      </section>
    </div>
  );
}

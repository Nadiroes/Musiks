"use client";

import { useEffect } from "react";
import { useMuziks, type ViewId } from "@/lib/muziks/store";
import { HomeView } from "./views/home";
import { StudioView } from "./views/studio";
import { LibraryView } from "./views/library";
import { AnalyzeView } from "./views/analyze";
import { TrainView } from "./views/train";
import { ModelsView } from "./views/models";
import { SetupView } from "./views/setup";
import { ConnectionView } from "./views/connection";
import { PlayerBar } from "./player-bar";
import { Equalizer } from "./ui-bits";
import {
  Home, Music4, Library as LibIcon, AudioWaveform, Dumbbell, Boxes, Terminal, Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { id: ViewId; label: string; short: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Accueil", short: "Accueil", icon: Home },
  { id: "studio", label: "Studio", short: "Studio", icon: Music4 },
  { id: "library", label: "Bibliothèque", short: "Biblio", icon: LibIcon },
  { id: "analyze", label: "Analyse audio", short: "Analyse", icon: AudioWaveform },
  { id: "train", label: "Entraînement", short: "Train", icon: Dumbbell },
  { id: "models", label: "Model Zoo", short: "Zoo", icon: Boxes },
  { id: "setup", label: "Installation", short: "Install", icon: Terminal },
  { id: "connection", label: "Connexion", short: "Connex", icon: Plug },
];

const TITLES: Record<ViewId, string> = {
  home: "Muziks — Studio IA",
  studio: "Studio · Muziks",
  library: "Bibliothèque · Muziks",
  analyze: "Analyse audio · Muziks",
  train: "Entraînement · Muziks",
  models: "Model Zoo · Muziks",
  setup: "Installation · Muziks",
  connection: "Connexion · Muziks",
};

export function AppShell() {
  const { view, setView, server, current, isPlaying } = useMuziks();

  // Titre dynamique + hash initial
  useEffect(() => {
    document.title = TITLES[view];
  }, [view]);

  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "") as ViewId;
      if (NAV.some((n) => n.id === h) && h !== useMuziks.getState().view) setView(h);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [setView]);

  // Poll du statut serveur
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        const d = await r.json();
        if (alive) useMuziks.getState().setServer(d);
      } catch {
        if (alive) useMuziks.getState().setServer({ online: false, error: "injoignable" });
      }
    };
    poll();
    const t = setInterval(poll, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const online = server.online === true;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 h-14 flex items-center gap-3">
          <button className="flex items-center gap-2 shrink-0" onClick={() => setView("home")} aria-label="Accueil Muziks">
            <img src="/logo-muziks.svg" alt="Logo Muziks" className="size-8" />
            <span className="text-lg font-bold tracking-tight">
              Muziks<span className="text-amber-400">.</span>
            </span>
          </button>
          <span className="text-[11px] text-muted-foreground hidden md:inline border-l pl-3 ml-1">
            Studio de génération musicale · ACE-Step 1.5
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                online
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : server.online === null
                    ? "border-border text-muted-foreground"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400",
              )}
              title={online ? "Serveur ACE-Step connecté" : "Serveur absent — mode démo"}
            >
              <span className={cn("size-1.5 rounded-full", online ? "bg-green-500" : server.online === null ? "bg-zinc-500" : "bg-amber-500")} />
              {online ? "ACE-Step connecté" : server.online === null ? "Détection…" : "Mode démo"}
            </span>
            {current && isPlaying && <Equalizer playing bars={3} className="text-amber-400" />}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-3 sm:px-4 flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 shrink-0 py-5 pr-4">
          <nav className="sticky top-20 space-y-1" aria-label="Navigation principale">
            {NAV.map((n) => {
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-amber-500/12 text-amber-300 border border-amber-500/25 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <n.icon className="size-4 shrink-0" />
                  {n.label}
                </button>
              );
            })}
            <div className="pt-3 px-3 text-[11px] text-muted-foreground leading-relaxed">
              Propulsé par{" "}
              <a href="https://github.com/ace-step/ACE-Step-1.5" target="_blank" rel="noopener noreferrer" className="text-amber-400/90 hover:underline">
                ACE-Step 1.5
              </a>{" "}
              (MIT)
            </div>
          </nav>
        </aside>

        {/* Contenu */}
        <main className="flex-1 min-w-0 py-6 pb-24">
          {view === "home" && <HomeView />}
          {view === "studio" && <StudioView />}
          {view === "library" && <LibraryView />}
          {view === "analyze" && <AnalyzeView />}
          {view === "train" && <TrainView />}
          {view === "models" && <ModelsView />}
          {view === "setup" && <SetupView />}
          {view === "connection" && <ConnectionView />}
        </main>
      </div>

      {/* Footer sticky */}
      <footer className="mt-auto border-t bg-sidebar pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            <b className="text-foreground">Muziks</b> — studio web construit sur{" "}
            <a href="https://github.com/ace-step/ACE-Step-1.5" target="_blank" rel="noopener noreferrer" className="text-amber-400/90 hover:underline">
              ACE-Step 1.5
            </a>{" "}
            · ACE Studio × StepFun · Licence MIT
          </p>
          <p className="flex items-center gap-3">
            <a href="https://acemusic.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">acemusic.ai</a>
            <a href="https://huggingface.co/ACE-Step" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Hugging Face</a>
            <a href="https://discord.gg/ace-step" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Discord</a>
          </p>
        </div>
      </footer>

      {/* Nav mobile (bas) */}
      <nav className="md:hidden fixed bottom-16 inset-x-0 z-40 border-t bg-background/95 backdrop-blur" aria-label="Navigation mobile">
        <div className="grid grid-cols-8">
          {NAV.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={cn("flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 text-[8.5px] leading-none", active ? "text-amber-400" : "text-muted-foreground")}
                aria-label={n.label}
              >
                <n.icon className="size-4 shrink-0" />
                <span className="truncate max-w-full">{n.short}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <PlayerBar />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { X, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useMuziks, type PlayerTrack } from "@/lib/muziks/store";
import { PlayButton, Equalizer } from "./ui-bits";

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Barre de lecture globale (fixe en bas, au-dessus du footer). */
export function PlayerBar() {
  const { current, isPlaying, toggle, stop, setCurrentTime, currentTime } = useMuziks();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  // Sync lecture/pause
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (isPlaying) a.play().catch(() => undefined);
    else a.pause();
  }, [isPlaying, current]);

  // Visualiseur décoratif (barres aléatoires lissées)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.offsetWidth * 2);
    const H = (canvas.height = canvas.offsetHeight * 2);
    const N = 48;
    const vals = new Float32Array(N);
    let t = 0;
    const draw = () => {
      t += isPlaying ? 0.08 : 0.015;
      ctx.clearRect(0, 0, W, H);
      const w = W / N;
      for (let i = 0; i < N; i++) {
        const target = isPlaying
          ? (Math.sin(t * (1.1 + i * 0.13) + i) * 0.5 + 0.5) * (Math.sin(t * 2.3 + i * 0.7) * 0.3 + 0.7)
          : 0.12;
        vals[i] += (target - vals[i]) * 0.25;
        const h = Math.max(4, vals[i] * H * 0.9);
        const grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, "oklch(0.77 0.16 68)");
        grad.addColorStop(1, "oklch(0.6 0.18 25 / 0.55)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(i * w + w * 0.18, H - h, w * 0.64, h, 3);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, isPlaying]);

  if (!current) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/85">
      <audio
        ref={audioRef}
        src={current.url}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setCurrentTime(a.currentTime);
        }}
        onEnded={() => useMuziks.setState({ isPlaying: false })}
        onError={() => useMuziks.setState({ isPlaying: false })}
        preload="auto"
      />
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 flex items-center gap-3">
        <PlayButton playing={isPlaying} onClick={toggle} />
        <div className="hidden sm:block w-40 shrink-0">
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <Equalizer playing bars={3} className="text-amber-400 h-3" />
            ) : (
              <Volume2 className="size-3.5 text-muted-foreground" />
            )}
            <p className="truncate text-sm font-medium">{current.title}</p>
          </div>
          {current.prompt && (
            <p className="truncate text-[11px] text-muted-foreground">{current.prompt}</p>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">{fmt(currentTime)}</span>
          <canvas ref={canvasRef} className="wave-canvas h-8 flex-1 min-w-0" aria-hidden />
          <span className="text-[11px] tabular-nums text-muted-foreground w-9">{fmt(current.duration || 0)}</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <Slider
            value={[Math.min(100, ((current.duration || 1) ? (currentTime / (current.duration || 1)) * 100 : 0))]}
            max={100}
            step={0.5}
            onValueChange={(v) => {
              const a = audioRef.current;
              if (a && a.duration) a.currentTime = (v[0] / 100) * a.duration;
            }}
            className="w-28"
            aria-label="Position de lecture"
          />
        </div>
        <button
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={stop}
          aria-label="Fermer le lecteur"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function playTrack(t: PlayerTrack) {
  useMuziks.getState().play(t);
}

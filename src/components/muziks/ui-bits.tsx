"use client";

import { useState } from "react";
import { Check, Copy, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMuziks } from "@/lib/muziks/store";

/** Bloc de code avec bouton copier (commandes d'installation). */
export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard indisponible */
    }
  };
  return (
    <div className={cn("rounded-lg border bg-black/40 overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-black/30">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={copy} aria-label="Copier">
            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </div>
      )}
      <pre className="code-scroll p-3 text-[12.5px] leading-relaxed font-mono text-amber-100/90 whitespace-pre-wrap break-words">
        {code}
      </pre>
      {!title && (
        <div className="px-3 pb-2 -mt-2 flex justify-end">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={copy} aria-label="Copier">
            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Petites barres d'égaliseur animées (état lecture). */
export function Equalizer({ playing, bars = 4, className }: { playing: boolean; bars?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-[2px] h-3.5", !playing && "eq-paused", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-sm bg-current"
          style={{ height: "100%", animationDelay: `${i * 0.13}s`, animationDuration: `${0.7 + (i % 3) * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/** Bouton lecture compact réutilisable. */
export function PlayButton({ playing, onClick, className }: { playing: boolean; onClick: () => void; className?: string }) {
  return (
    <Button
      size="icon"
      onClick={onClick}
      className={cn("size-9 rounded-full shrink-0", className)}
      aria-label={playing ? "Pause" : "Lecture"}
    >
      {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-[1px]" />}
    </Button>
  );
}

/** Badge de statut coloré. */
export function StatusBadge({ status }: { status: 0 | 1 | 2 | 3 }) {
  const map = {
    0: { label: "En cours", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    1: { label: "Terminé", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    2: { label: "Échec", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    3: { label: "Arrêté", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  } as const;
  const s = map[status] ?? map[0];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", s.cls)}>{s.label}</span>;
}

/** En-tête de section réutilisable. */
export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Lien externe stylé. */
export function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

export { useMuziks };

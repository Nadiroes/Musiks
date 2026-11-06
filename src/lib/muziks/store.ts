"use client";

import { create } from "zustand";

export type PlayerTrack = {
  id: string;
  title: string;
  url: string;
  prompt?: string;
  bpm?: number | null;
  keyScale?: string | null;
  mode?: string;
  duration?: number | null;
};

export type ViewId =
  | "home" | "studio" | "library" | "analyze" | "train" | "models" | "setup" | "connection";

export type ServerStatus = {
  online: boolean | null;
  models?: unknown | null;
  stats?: unknown | null;
  error?: string | null;
};

type MuziksState = {
  // Player global
  current: PlayerTrack | null;
  isPlaying: boolean;
  play: (t: PlayerTrack) => void;
  toggle: () => void;
  stop: () => void;

  // Navigation
  view: ViewId;
  setView: (v: ViewId) => void;

  // Restauration de paramètres vers le Studio
  restoreParams: unknown | null;
  restoreToken: number;
  sendToStudio: (params: unknown, mode?: string) => void;

  // Fichier source envoyé vers le studio (Remix/Repaint/…)
  srcHandoff: { url: string; name: string } | null;
  srcHandoffToken: number;
  sendSrcToStudio: (src: { url: string; name: string }) => void;

  // Statut serveur (pollé par le shell)
  server: ServerStatus;
  setServer: (s: ServerStatus) => void;

  // RAF du player pour l'anim (temps courant)
  currentTime: number;
  setCurrentTime: (t: number) => void;
};

export const useMuziks = create<MuziksState>((set, get) => ({
  current: null,
  isPlaying: false,
  play: (t) => {
    const cur = get().current;
    if (cur && cur.id === t.id) {
      set({ isPlaying: !get().isPlaying });
    } else {
      set({ current: t, isPlaying: true, currentTime: 0 });
    }
  },
  toggle: () => {
    if (get().current) set({ isPlaying: !get().isPlaying });
  },
  stop: () => set({ isPlaying: false, current: null, currentTime: 0 }),

  view: "home",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${v}`);
  },

  restoreParams: null,
  restoreToken: 0,
  sendToStudio: (params) =>
    set((s) => ({ restoreParams: params, restoreToken: s.restoreToken + 1, view: "studio" })),

  srcHandoff: null,
  srcHandoffToken: 0,
  sendSrcToStudio: (src) =>
    set((s) => ({ srcHandoff: src, srcHandoffToken: s.srcHandoffToken + 1, view: "studio" })),

  server: { online: null },
  setServer: (s) => set({ server: s }),

  currentTime: 0,
  setCurrentTime: (t) => set({ currentTime: t }),
}));

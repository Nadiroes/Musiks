"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(() => import("@/components/muziks/app-shell").then((m) => m.AppShell), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <img src="/logo-muziks.svg" alt="Muziks" className="size-14 mx-auto animate-pulse" />
        <p className="text-sm text-muted-foreground">Chargement du studio Muziks…</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <AppShell />;
}

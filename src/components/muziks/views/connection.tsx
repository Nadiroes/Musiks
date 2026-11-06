"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Server, KeyRound, Loader2, RefreshCw, Plug, Activity, Boxes } from "lucide-react";
import { useMuziks } from "@/lib/muziks/store";
import { SectionHead, ExtLink } from "../ui-bits";
import { LINKS } from "@/lib/muziks/constants";

type HealthData = {
  online: boolean;
  error?: string;
  health?: { data?: { status?: string; service?: string; version?: string } } | null;
  models?: { data?: { models?: { name: string; is_default?: boolean; is_loaded?: boolean }[]; default_model?: string } } | null;
  stats?: { data?: { jobs?: Record<string, number>; queue_size?: number; queue_maxsize?: number; avg_job_seconds?: number } } | null;
};

export function ConnectionView() {
  const { server, setServer } = useMuziks();
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8001");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [detail, setDetail] = useState<HealthData | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/settings");
    const d = await r.json();
    setApiUrl(d.settings?.apiUrl ?? "http://127.0.0.1:8001");
    setHasKey(Boolean(d.hasKey));
    setApiKey(d.hasKey ? "••••••••" : "");
  }, []);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch("/api/health");
      const d: HealthData = await r.json();
      setDetail(d);
      setServer(d);
      if (d.online) toast({ title: "Serveur ACE-Step connecté", description: `Service : ${d.health?.data?.service ?? "ACE-Step API"}` });
      else toast({ title: "Serveur injoignable", description: d.error || "Mode démo actif.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  }, [setServer]);

  useEffect(() => { load(); check(); }, [load, check]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl, apiKey }),
      });
      const d = await r.json();
      setHasKey(Boolean(d.hasKey));
      setApiKey(d.settings?.apiKey ?? "");
      toast({ title: "Paramètres enregistrés" });
      setTimeout(check, 300);
    } finally {
      setSaving(false);
    }
  };

  const online = detail?.online === true;
  const jobs = detail?.stats?.data?.jobs;

  return (
    <div className="space-y-5">
      <SectionHead
        title="Connexion au moteur ACE-Step"
        sub="Muziks pilote le serveur API REST d'ACE-Step 1.5 (défaut : 127.0.0.1:8001). Sans serveur, l'app reste 100 % utilisable en mode démo."
        right={
          <Button variant="secondary" size="sm" onClick={check} disabled={checking}>
            {checking ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <RefreshCw className="size-3.5 mr-1" />}
            Tester
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="url" className="flex items-center gap-1.5"><Server className="size-4 text-amber-400" /> URL du serveur API</Label>
              <Input id="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://127.0.0.1:8001" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Lancez <code className="font-mono text-amber-300">uv run acestep-api</code> dans le dépôt cloné.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key" className="flex items-center gap-1.5"><KeyRound className="size-4 text-amber-400" /> Clé API (optionnelle)</Label>
              <Input id="key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ACESTEP_API_KEY" type="password" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">
                {hasKey ? "Une clé est enregistrée (masquée)." : "Définie côté serveur par export ACESTEP_API_KEY=…"}
              </p>
            </div>
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500">
              <Plug className="size-4 mr-1.5" /> {saving ? "Enregistrement…" : "Enregistrer & tester"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">État du service</h3>
              <Badge variant={online ? "default" : "secondary"} className={online ? "bg-green-500/15 text-green-400 border-green-500/30" : ""}>
                {online ? "En ligne" : server.online === null ? "…" : "Hors ligne (démo)"}
              </Badge>
            </div>
            {online ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2.5">
                  <Info label="Service" value={detail?.health?.data?.service ?? "—"} />
                  <Info label="Version" value={detail?.health?.data?.version ?? "—"} />
                  <Info label="File d'attente" value={`${detail?.stats?.data?.queue_size ?? 0}/${detail?.stats?.data?.queue_maxsize ?? 200}`} />
                  <Info label="Durée moy. / job" value={`${detail?.stats?.data?.avg_job_seconds?.toFixed?.(1) ?? "—"} s`} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {jobs && Object.entries(jobs).map(([k, v]) => (
                    <div key={k} className="rounded-lg border bg-black/20 p-2 text-center">
                      <p className="text-lg font-bold text-amber-300">{v}</p>
                      <p className="text-[10px] text-muted-foreground">{k}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium flex items-center gap-1 mb-1"><Boxes className="size-3.5 text-amber-400" /> Modèles DiT chargés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail?.models?.data?.models?.map((m) => (
                      <Badge key={m.name} variant="secondary" className="font-mono text-[10px]">
                        {m.name}{m.is_default ? " ★" : ""}{m.is_loaded ? " ✓" : ""}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Défaut : <code className="font-mono">{detail?.models?.data?.default_model ?? "—"}</code> — basculez avec <code className="font-mono">POST /v1/init</code>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><Activity className="size-4 text-amber-400" /> Le serveur n&apos;est pas détecté.</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Clonez le dépôt : <code className="font-mono text-amber-300">git clone https://github.com/ACE-Step/ACE-Step-1.5.git</code></li>
                  <li>Installez : <code className="font-mono text-amber-300">uv sync</code></li>
                  <li>Lancez : <code className="font-mono text-amber-300">ACESTEP_API_HOST=0.0.0.0 uv run acestep-api</code></li>
                  <li>Revenez ici et cliquez « Tester ».</li>
                </ol>
                <p className="text-xs">Guide complet : <ExtLink href={LINKS.docs.install}>INSTALL.md</ExtLink> · <ExtLink href={LINKS.docs.api}>API.md</ExtLink></p>
              </div>
            )}
            {!online && detail?.error && (
              <p className="text-xs text-red-400/80 font-mono break-all">{detail.error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-black/20 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

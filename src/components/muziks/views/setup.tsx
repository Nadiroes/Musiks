"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, BookOpen, Download, Server, Package, Cpu } from "lucide-react";
import { SectionHead, CodeBlock, ExtLink } from "../ui-bits";
import { LINKS } from "@/lib/muziks/constants";

export function SetupView() {
  return (
    <div className="space-y-5">
      <SectionHead
        title="Installation & API"
        sub="Toutes les commandes et tous les liens officiels du dépôt ace-step/ACE-Step-1.5 pour brancher Muziks sur vos modèles locaux."
        right={
          <ExtLink href={LINKS.github}>Dépôt GitHub officiel</ExtLink>
        }
      />

      <Tabs defaultValue="quickstart">
        <TabsList className="flex-wrap">
          <TabsTrigger value="quickstart">Démarrage rapide</TabsTrigger>
          <TabsTrigger value="scripts">Scripts de lancement</TabsTrigger>
          <TabsTrigger value="env">Configuration (.env)</TabsTrigger>
          <TabsTrigger value="api">API REST</TabsTrigger>
          <TabsTrigger value="python">Python & CLI</TabsTrigger>
          <TabsTrigger value="packages">Paquets portables & Docker</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        {/* ---------- Quick start ---------- */}
        <TabsContent value="quickstart" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Terminal className="size-4 text-amber-400" /> Installation complète (macOS / Linux)</h3>
              <CodeBlock
                title="Terminal"
                code={`# 1. Installer uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Cloner & installer
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync

# 3. Lancer l'UI Gradio (modèles auto-téléchargés au 1er lancement)
uv run acestep

# Ou lancer le serveur API REST (recommandé pour Muziks)
uv run acestep-api`}
              />
              <p className="text-sm text-muted-foreground">
                Gradio : <code className="font-mono text-amber-300">http://localhost:7860</code> · API REST :{" "}
                <code className="font-mono text-amber-300">http://localhost:8001</code> — c&apos;est cette dernière que Muziks appelle
                (réglez-la dans <b className="text-foreground">Connexion</b>).
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Terminal className="size-4 text-amber-400" /> Windows (PowerShell)</h3>
              <CodeBlock
                title="PowerShell"
                code={`# 1. Installer uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Cloner & installer
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync

# 3. Lancer
uv run acestep        # UI Gradio
uv run acestep-api    # serveur API REST`}
              />
              <p className="text-xs text-muted-foreground">
                Prérequis : Python 3.11–3.12, GPU CUDA recommandé (également MPS / ROCm / Intel XPU / CPU).
                ROCm sous Windows exige Python 3.12.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Server className="size-4 text-amber-400" /> Connecter le serveur à Muziks</h3>
              <CodeBlock
                title="Lancement adapté à Muziks"
                code={`# Serveur API accessible depuis Muziks (toutes interfaces)
ACESTEP_API_HOST=0.0.0.0 ACESTEP_API_PORT=8001 uv run acestep-api

# Avec authentification par clé API (optionnel, recommandé en production)
export ACESTEP_API_KEY=votre-cle-secrete
uv run acestep-api

# Avec un modèle DiT + LM précis
ACESTEP_CONFIG_PATH=acestep-v15-turbo \
ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-1.7B \
uv run acestep-api`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Launch scripts ---------- */}
        <TabsContent value="scripts" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Cpu className="size-4 text-amber-400" /> Scripts prêts à l&apos;emploi (détection auto d&apos;environnement)</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <CodeBlock title="Windows (CUDA)" code={`start_gradio_ui.bat
start_api_server.bat`} />
                <CodeBlock title="Windows (ROCm / AMD)" code={`start_gradio_ui_rocm.bat
start_api_server_rocm.bat`} />
                <CodeBlock title="Linux (CUDA)" code={`chmod +x start_gradio_ui.sh && ./start_gradio_ui.sh
chmod +x start_api_server.sh && ./start_api_server.sh`} />
                <CodeBlock title="macOS (Apple Silicon, MLX)" code={`chmod +x start_gradio_ui_macos.sh && ./start_gradio_ui_macos.sh
chmod +x start_api_server_macos.sh && ./start_api_server_macos.sh`} />
              </div>
              <p className="text-xs text-muted-foreground">
                Ces scripts gèrent l&apos;installation des dépendances, la vérification de mise à jour (check_update.sh/.bat) et le démarrage. ROCm Linux : requirements-rocm-linux.txt ; Intel XPU : setup_xpu.bat / README-XPU.md.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Autres commandes utiles du dépôt</h3>
              <CodeBlock
                title="Utilitaires"
                code={`# Mise à jour / vérification d'environnement
./check_update.sh                 # (Windows : check_update.bat)

# Test rapide
./quick_test.sh                   # (Windows : quick_test.bat)

# Profil & benchmark (LLM / DiT / VAE)
python profile_inference.py
python profile_inference.py --mode benchmark

# Génération d'exemples officiels
python generate_examples.py

# Fusion de configs (LoRA)
./merge_config.sh                 # (Windows : merge_config.bat)

# Arrêt du serveur API
./close_api_server.sh`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Env ---------- */}
        <TabsContent value="env" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Package className="size-4 text-amber-400" /> Fichier .env (persiste les réglages entre les mises à jour)</h3>
              <CodeBlock
                title=".env"
                code={`# Copier l'exemple puis éditer
cp .env.example .env

# Exemples de variables :
ACESTEP_CONFIG_PATH=acestep-v15-turbo      # modèle DiT principal
ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-1.7B  # modèle LM 5Hz
PORT=7860                                  # port de l'UI Gradio
LANGUAGE=en                                # langue de l'interface
# Partage du stockage des modèles entre instances
# ACESTEP_CHECKPOINTS_DIR=/chemin/commun/checkpoints`}
              />
              <h3 className="font-semibold pt-2">Variables du serveur API</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead className="bg-black/30 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Variable</th>
                      <th className="px-3 py-2 font-medium">Défaut</th>
                      <th className="px-3 py-2 font-medium">Rôle</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11.5px]">
                    {[
                      ["ACESTEP_API_HOST", "127.0.0.1", "hôte d'écoute du serveur API"],
                      ["ACESTEP_API_PORT", "8001", "port du serveur API"],
                      ["ACESTEP_API_KEY", "(vide)", "clé d'authentification (vide = sans auth)"],
                      ["ACESTEP_API_WORKERS", "1", "threads de travail"],
                      ["ACESTEP_CONFIG_PATH", "acestep-v15-turbo", "modèle DiT principal"],
                      ["ACESTEP_CONFIG_PATH2/3", "(vide)", "2e/3e modèle DiT (multi-slot)"],
                      ["ACESTEP_DEVICE", "auto", "device de chargement"],
                      ["ACESTEP_USE_FLASH_ATTENTION", "true", "flash attention"],
                      ["ACESTEP_OFFLOAD_TO_CPU", "false", "offload CPU quand inactif"],
                      ["ACESTEP_INIT_LLM", "auto", "initialiser le LM au démarrage"],
                      ["ACESTEP_LM_MODEL_PATH", "acestep-5Hz-lm-0.6B", "modèle LM par défaut"],
                      ["ACESTEP_LM_BACKEND", "vllm", "backend LM (vllm ou pt)"],
                      ["ACESTEP_QUEUE_MAXSIZE", "200", "taille max de la file"],
                      ["ACESTEP_TMPDIR", ".cache/acestep/tmp", "fichiers temporaires"],
                    ].map(([v, d, r]) => (
                      <tr key={v} className="border-t">
                        <td className="px-3 py-1.5 text-amber-300">{v}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{d}</td>
                        <td className="px-3 py-1.5 font-sans text-muted-foreground">{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- API REST ---------- */}
        <TabsContent value="api" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Endpoints principaux (port 8001)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead className="bg-black/30 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Endpoint</th>
                      <th className="px-3 py-2 font-medium">Méthode</th>
                      <th className="px-3 py-2 font-medium">Rôle</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11.5px]">
                    {[
                      ["/release_task", "POST", "soumettre une tâche de génération (text2music, cover, repaint, lego, extract, complete)"],
                      ["/query_result", "POST", "interroger le statut des tâches (0=en cours, 1=succès, 2=échec)"],
                      ["/v1/audio?path=…", "GET", "télécharger un audio généré"],
                      ["/format_input", "POST", "améliorer caption + paroles via le LM"],
                      ["/create_random_sample", "POST", "tirer un exemple (simple_mode / custom_mode)"],
                      ["/v1/models", "GET", "lister les modèles DiT chargés"],
                      ["/v1/init", "POST", "initialiser / changer de modèle à chaud (slots 1-3)"],
                      ["/v1/stats", "GET", "statistiques serveur (file, jobs)"],
                      ["/health", "GET", "état du service"],
                      ["/v1/training/start", "POST", "démarrer un entraînement LoRA"],
                      ["/v1/training/start_lokr", "POST", "démarrer un entraînement LoKr"],
                      ["/v1/training/status · /stop", "POST", "suivre / arrêter l'entraînement"],
                    ].map(([e, m, r]) => (
                      <tr key={e} className="border-t">
                        <td className="px-3 py-1.5 text-amber-300">{e}</td>
                        <td className="px-3 py-1.5"><Badge variant="secondary" className="text-[10px]">{m}</Badge></td>
                        <td className="px-3 py-1.5 font-sans text-muted-foreground">{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="font-semibold pt-2">Exemples curl</h3>
              <CodeBlock
                title="Text2Music (turbo)"
                code={`curl -X POST http://localhost:8001/release_task \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt": "upbeat pop song",
    "lyrics": "Hello world",
    "thinking": true,
    "inference_steps": 8
  }'

# Puis interroger le résultat
curl -X POST http://localhost:8001/query_result \\
  -H 'Content-Type: application/json' \\
  -d '{"task_id_list": ["<task_id>"]}'`}
              />
              <CodeBlock
                title="Repaint (édition locale d'un segment)"
                code={`curl -X POST http://localhost:8001/release_task \\
  -F "prompt=remix this song" \\
  -F "src_audio=@/chemin/vers/chanson.mp3" \\
  -F "task_type=repaint" \\
  -F "repainting_start=10" \\
  -F "repainting_end=20" \\
  -F "chunk_mask_mode=explicit"`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Python & CLI ---------- */}
        <TabsContent value="python" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">API Python (programmatique)</h3>
              <CodeBlock
                title="Python"
                code={`# cf. docs/en/INFERENCE.md
from acestep import AceStepPipeline

pipeline = AceStepPipeline()

result = pipeline(
    prompt="upbeat pop rock with electric guitars",
    lyrics="[Verse 1]\\nHello world\\n[Chorus]\\nStay strong",
    duration=60,              # 10 à 600 secondes
    inference_steps=8,        # turbo : 8
    batch_size=2,             # jusqu'à 8
    audio_format="mp3",
)
print(result["audio_paths"])`}
              />
              <h3 className="font-semibold pt-2">CLI interactive</h3>
              <CodeBlock
                title="Terminal"
                code={`# Assistant interactif (choix du modèle, paramètres, génération)
uv run acestep-cli --help
# cf. docs/en/CLI.md`}
              />
              <h3 className="font-semibold pt-2">Serveur compatible OpenRouter</h3>
              <CodeBlock
                title="Terminal"
                code={`./run_openrouter_api_server.sh
# dossier openrouter/ : adaptateur OpenRouter pour exposer ACE-Step comme modèle chat`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Paquets ---------- */}
        <TabsContent value="packages" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Download className="size-4 text-amber-400" /> Paquets portables (dépendances préinstallées)</h3>
              <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                <li>
                  Windows :{" "}
                  <ExtLink href="https://files.acemusic.ai/acemusic/win/ACE-Step-1.5.7z">ACE-Step-1.5.7z</ExtLink>{" "}
                  (guide : <ExtLink href={`${LINKS.docs.install}#-windows-portable-package`}>INSTALL.md § Windows</ExtLink>)
                </li>
                <li>
                  macOS :{" "}
                  <ExtLink href="https://files.acemusic.ai/acemusic/mac/ACE-Step-1.5.zip">ACE-Step-1.5.zip</ExtLink>{" "}
                  (guide : <ExtLink href={`${LINKS.docs.install}#-macos-portable-package`}>INSTALL.md § macOS</ExtLink>)
                </li>
              </ul>
              <h3 className="font-semibold pt-2">Docker</h3>
              <CodeBlock
                title="Docker"
                code={`# Image générique (build CI automatique) — voir Dockerfile & docker-compose.yml
docker compose up -d          # docker-compose.yml
# Jetson (NVIDIA embedded) — Dockerfile.jetson & docker-compose.jetson.yml
docker compose -f docker-compose.jetson.yml up -d`}
              />
              <h3 className="font-semibold pt-2">VST3 & écosystème</h3>
              <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                <li>Plugin VST3 pour DAW (C++/GGML) : <ExtLink href={LINKS.vst3}>acestep.vst3</ExtLink></li>
                <li>Entraînement avancé Side-Step (LoKR, timestep corrigé) : <ExtLink href={LINKS.sidestep}>koda-dernet/Side-Step</ExtLink> + <ExtLink href="https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/sidestep/Getting%20Started.md">Getting Started.md</ExtLink></li>
                <li>ComfyUI, UIs alternatives, déploiements cloud : <ExtLink href={LINKS.awesome}>Awesome ACE-Step</ExtLink></li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Docs ---------- */}
        <TabsContent value="docs" className="pt-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold flex items-center gap-2 mb-2"><BookOpen className="size-4 text-amber-400" /> Documentation officielle</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { t: "Installation (EN)", href: LINKS.docs.install },
                  { t: "API REST", href: LINKS.docs.api },
                  { t: "Guide Gradio", href: LINKS.docs.gradio },
                  { t: "API Python (Inference)", href: LINKS.docs.inference },
                  { t: "CLI", href: LINKS.docs.cli },
                  { t: "Tutoriel général", href: LINKS.docs.tutorial },
                  { t: "LoRA Training", href: LINKS.docs.lora },
                  { t: "Compatibilité GPU", href: LINKS.docs.gpu },
                  { t: "Dépannage GPU", href: LINKS.docs.troubleshooting },
                  { t: "Benchmark & Profiling", href: LINKS.docs.benchmark },
                  { t: "Rapport technique", href: LINKS.technicalReport },
                  { t: "Sécurité (SECURITY.md)", href: "https://github.com/ace-step/ACE-Step-1.5/blob/main/SECURITY.md" },
                ].map((d) => (
                  <a key={d.t} href={d.href} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border px-3 py-2.5 text-sm hover:border-amber-500/40 hover:bg-accent transition-colors flex items-center justify-between">
                    {d.t} <span className="text-muted-foreground text-xs">↗</span>
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Docs multi-langues : le dépôt fournit chaque guide en <b>EN</b> / <b>中文</b> / <b>日本語</b> / <b>한국어</b>{" "}
                (docs/en, docs/zh, docs/ja, docs/ko) — même arborescence de fichiers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

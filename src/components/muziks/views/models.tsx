"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ExternalLink, Boxes, Brain } from "lucide-react";
import { SectionHead, ExtLink } from "../ui-bits";
import { DIT_MODELS, LM_MODELS, GPU_GUIDE, LINKS } from "@/lib/muziks/constants";
import { useMuziks } from "@/lib/muziks/store";

function Bool({ v }: { v: boolean }) {
  return v ? (
    <Check className="size-4 text-green-500 mx-auto" aria-label="supporté" />
  ) : (
    <X className="size-4 text-zinc-600 mx-auto" aria-label="non supporté" />
  );
}

export function ModelsView() {
  const setView = useMuziks((s) => s.setView);
  return (
    <div className="space-y-5">
      <SectionHead
        title="Model Zoo"
        sub="Les checkpoints officiels ACE-Step 1.5 — téléchargés automatiquement au premier lancement. Le Gradio / l'API adaptent les réglages à votre GPU."
        right={
          <ExtLink href={LINKS.huggingface}>Page Hugging Face ACE-Step</ExtLink>
        }
      />

      <Tabs defaultValue="dit">
        <TabsList>
          <TabsTrigger value="dit">Modèles DiT</TabsTrigger>
          <TabsTrigger value="xl">Série XL (4B)</TabsTrigger>
          <TabsTrigger value="lm">Modèles LM 5Hz</TabsTrigger>
          <TabsTrigger value="gpu">Guide GPU</TabsTrigger>
        </TabsList>

        <TabsContent value="dit" className="pt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead className="text-center">CFG</TableHead>
                    <TableHead className="text-center">Audio réf.</TableHead>
                    <TableHead className="text-center">Text2Music</TableHead>
                    <TableHead className="text-center">Cover</TableHead>
                    <TableHead className="text-center">Repaint</TableHead>
                    <TableHead className="text-center">Extract</TableHead>
                    <TableHead className="text-center">Lego</TableHead>
                    <TableHead className="text-center">Complete</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead>Diversité</TableHead>
                    <TableHead className="text-right">Hugging Face</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DIT_MODELS.filter((m) => !m.xl).map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-mono text-xs">{m.name}</TableCell>
                      <TableCell>{m.steps}</TableCell>
                      <TableCell className="text-center"><Bool v={m.cfg} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.referAudio} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.text2music} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.cover} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.repaint} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.extract} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.lego} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.complete} /></TableCell>
                      <TableCell><Badge variant="secondary">{m.quality}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{m.diversity}</Badge></TableCell>
                      <TableCell className="text-right">
                        <a href={m.hf} target="_blank" rel="noopener noreferrer" className="inline-flex text-amber-400 hover:underline">
                          <ExternalLink className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xl" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                La <b className="text-foreground">série XL</b> utilise un décodeur DiT de <b className="text-foreground">4 milliards de paramètres</b>
                (~9 Go en bf16, vs ~4,7 Go pour le 2B) pour une qualité audio supérieure. Nécessite ≥ 12 Go de VRAM
                (avec offload + quantification) ou ≥ 20 Go (sans offload). Tous les modèles LM sont compatibles.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modèle XL</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead className="text-center">CFG</TableHead>
                    <TableHead className="text-center">Extract / Lego / Complete</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead className="text-right">Hugging Face</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DIT_MODELS.filter((m) => m.xl).map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-mono text-xs">{m.name}</TableCell>
                      <TableCell>{m.steps}</TableCell>
                      <TableCell className="text-center"><Bool v={m.cfg} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.extract} /></TableCell>
                      <TableCell><Badge variant="secondary">{m.quality}</Badge></TableCell>
                      <TableCell className="text-right">
                        <a href={m.hf} target="_blank" rel="noopener noreferrer" className="inline-flex text-amber-400 hover:underline">
                          <ExternalLink className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lm" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modèle LM</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead className="text-center">CoT méta</TableHead>
                    <TableHead className="text-center">Query rewrite</TableHead>
                    <TableHead>Compréhension audio</TableHead>
                    <TableHead>Composition</TableHead>
                    <TableHead>Copie de mélodie</TableHead>
                    <TableHead>VRAM</TableHead>
                    <TableHead className="text-right">Hugging Face</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LM_MODELS.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-mono text-xs">{m.name}</TableCell>
                      <TableCell>{m.base}</TableCell>
                      <TableCell className="text-center"><Bool v={m.cotMetas} /></TableCell>
                      <TableCell className="text-center"><Bool v={m.rewrite} /></TableCell>
                      <TableCell>{m.audioUnderstanding}</TableCell>
                      <TableCell>{m.composition}</TableCell>
                      <TableCell>{m.copyMelody}</TableCell>
                      <TableCell><Badge variant="secondary">{m.vram}</Badge></TableCell>
                      <TableCell className="text-right">
                        <a href={m.hf} target="_blank" rel="noopener noreferrer" className="inline-flex text-amber-400 hover:underline">
                          <ExternalLink className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground flex gap-2">
              <Brain className="size-4 shrink-0 mt-0.5 text-amber-400" />
              Le LM planifie la chanson (méta, paroles, caption) via Chain-of-Thought et pilote le DiT.
              Sans LM (GPU ≤ 6 Go), le DiT fonctionne seul en text2music classique.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gpu" className="pt-4 space-y-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VRAM</TableHead>
                    <TableHead>DiT recommandé</TableHead>
                    <TableHead>LM recommandé</TableHead>
                    <TableHead>Backend</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GPU_GUIDE.map((g) => (
                    <TableRow key={g.vram}>
                      <TableCell className="font-semibold text-amber-300">{g.vram}</TableCell>
                      <TableCell className="text-xs">{g.dit}</TableCell>
                      <TableCell className="text-xs">{g.lm}</TableCell>
                      <TableCell><Badge variant="secondary">{g.backend}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground flex gap-2">
              <Boxes className="size-4 shrink-0 mt-0.5 text-amber-400" />
              L&apos;interface sélectionne automatiquement la meilleure configuration pour votre GPU (LM, backend,
              offload, quantification). Détails :{" "}
              <ExtLink href={LINKS.docs.gpu}>GPU_COMPATIBILITY.md</ExtLink> ·{" "}
              <button className="text-amber-400 hover:underline" onClick={() => setView("connection")}>tester votre serveur</button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

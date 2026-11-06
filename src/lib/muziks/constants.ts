// Constantes et types ACE-Step 1.5 pour Muziks
// Source : https://github.com/ace-step/ACE-Step-1.5

export type TaskType =
  | "text2music"
  | "cover"
  | "repaint"
  | "lego"
  | "extract"
  | "complete";

export type GenerationMode =
  | "simple"
  | "custom"
  | "remix"
  | "repaint"
  | "extract"
  | "lego"
  | "complete"
  | "v2bgm";

export const MODES: {
  id: GenerationMode;
  taskType: TaskType;
  label: string;
  desc: string;
  needsSrc: boolean;
  baseOnly: boolean;
  icon: string;
}[] = [
  { id: "simple", taskType: "text2music", label: "Simple", desc: "Décrivez la chanson en langage naturel, le LM écrit tout le reste (caption, paroles, méta).", needsSrc: false, baseOnly: false, icon: "wand" },
  { id: "custom", taskType: "text2music", label: "Personnalisé", desc: "Contrôle total : caption, paroles, audio de référence, méta-données.", needsSrc: false, baseOnly: false, icon: "sliders" },
  { id: "remix", taskType: "cover", label: "Remix / Cover", desc: "Transformez un audio existant dans un autre style en gardant la structure mélodique.", needsSrc: true, baseOnly: false, icon: "shuffle" },
  { id: "repaint", taskType: "repaint", label: "Repaint", desc: "Régénérez un segment temporel précis d'un audio, le reste reste intact.", needsSrc: true, baseOnly: false, icon: "paintbrush" },
  { id: "extract", taskType: "extract", label: "Extract (stems)", desc: "Séparez et isolez une piste précise : voix, batterie, basse, guitare…", needsSrc: true, baseOnly: true, icon: "split" },
  { id: "lego", taskType: "lego", label: "Lego (Add Layer)", desc: "Ajoutez une nouvelle piste d'instrument par-dessus un audio existant.", needsSrc: true, baseOnly: true, icon: "blocks" },
  { id: "complete", taskType: "complete", label: "Complete", desc: "Complétez une maquette avec plusieurs instruments (arrangement auto).", needsSrc: true, baseOnly: true, icon: "list-music" },
  { id: "v2bgm", taskType: "cover", label: "Vocal2BGM", desc: "Générez automatiquement l'accompagnement instrumental d'une voix chantée.", needsSrc: true, baseOnly: false, icon: "mic-vocal" },
];

// Pistes extractibles / ajoutables (cf. GRADIO_GUIDE.md)
export const TRACK_NAMES = [
  "vocals", "backing_vocals", "drums", "bass", "guitar", "keyboard",
  "percussion", "strings", "synth", "fx", "brass", "woodwinds",
];

export const VOCAL_LANGUAGES = [
  { value: "unknown", label: "Détection auto (unknown)" },
  { value: "en", label: "Anglais" },
  { value: "fr", label: "Français" },
  { value: "zh", label: "Chinois" },
  { value: "ja", label: "Japonais" },
  { value: "ko", label: "Coréen" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "pt", label: "Portugais" },
  { value: "it", label: "Italien" },
  { value: "ar", label: "Arabe" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russe" },
];

export const AUDIO_FORMATS = ["mp3", "flac", "opus", "aac", "wav", "wav32"];

export const KEYS = [
  "C Major", "G Major", "D Major", "A Major", "E Major", "B Major",
  "F# Major", "C# Major", "F# minor", "C# minor", "F Major", "Bb Major",
  "Eb Major", "Ab Major", "A minor", "E minor", "B minor", "D minor",
  "G minor", "C minor", "F minor", "Bb minor", "Am", "Cm", "Dm", "Em", "Fm", "Gm",
];

export const TIME_SIGNATURES = [
  { value: "2", label: "2/4" },
  { value: "3", label: "3/4" },
  { value: "4", label: "4/4" },
  { value: "6", label: "6/8" },
];

// Model Zoo — modèles DiT (source: README.md)
export const DIT_MODELS = [
  { name: "acestep-v15-base", family: "2B", steps: "50", cfg: true, referAudio: true, text2music: true, cover: true, repaint: true, extract: true, lego: true, complete: true, quality: "Moyenne", diversity: "Élevée", finetune: "Facile", hf: "https://huggingface.co/ACE-Step/acestep-v15-base", xl: false },
  { name: "acestep-v15-sft", family: "2B", steps: "50", cfg: true, referAudio: true, text2music: true, cover: true, repaint: true, extract: false, lego: false, complete: false, quality: "Élevée", diversity: "Moyenne", finetune: "Facile", hf: "https://huggingface.co/ACE-Step/acestep-v15-sft", xl: false },
  { name: "acestep-v15-turbo", family: "2B", steps: "8", cfg: false, referAudio: true, text2music: true, cover: true, repaint: true, extract: false, lego: false, complete: false, quality: "Très élevée", diversity: "Moyenne", finetune: "Moyenne", hf: "https://huggingface.co/ACE-Step/Ace-Step1.5", xl: false },
  { name: "acestep-v15-xl-base", family: "4B XL", steps: "50", cfg: true, referAudio: true, text2music: true, cover: true, repaint: true, extract: true, lego: true, complete: true, quality: "Élevée", diversity: "Élevée", finetune: "Facile", hf: "https://huggingface.co/ACE-Step/acestep-v15-xl-base", xl: true },
  { name: "acestep-v15-xl-sft", family: "4B XL", steps: "50", cfg: true, referAudio: true, text2music: true, cover: true, repaint: true, extract: false, lego: false, complete: false, quality: "Très élevée", diversity: "Moyenne", finetune: "Facile", hf: "https://huggingface.co/ACE-Step/acestep-v15-xl-sft", xl: true },
  { name: "acestep-v15-xl-turbo", family: "4B XL", steps: "8", cfg: false, referAudio: true, text2music: true, cover: true, repaint: true, extract: false, lego: false, complete: false, quality: "Très élevée", diversity: "Moyenne", finetune: "Moyenne", hf: "https://huggingface.co/ACE-Step/acestep-v15-xl-turbo", xl: true },
];

// Model Zoo — modèles LM 5Hz (source: README.md)
export const LM_MODELS = [
  { name: "acestep-5Hz-lm-0.6B", base: "Qwen3-0.6B", cotMetas: true, rewrite: true, audioUnderstanding: "Moyenne", composition: "Moyenne", copyMelody: "Faible", hf: "https://huggingface.co/ACE-Step/acestep-5Hz-lm-0.6B", vram: "6–8 Go+" },
  { name: "acestep-5Hz-lm-1.7B", base: "Qwen3-1.7B", cotMetas: true, rewrite: true, audioUnderstanding: "Moyenne", composition: "Moyenne", copyMelody: "Moyenne", hf: "https://huggingface.co/ACE-Step/acestep-5Hz-lm-1.7B", vram: "8–16 Go+" },
  { name: "acestep-5Hz-lm-4B", base: "Qwen3-4B", cotMetas: true, rewrite: true, audioUnderstanding: "Forte", composition: "Forte", copyMelody: "Forte", hf: "https://huggingface.co/ACE-Step/acestep-5Hz-lm-4B", vram: "24 Go+" },
];

// Guide de choix GPU (source: README.md)
export const GPU_GUIDE = [
  { vram: "≤ 6 Go", dit: "2B turbo", lm: "Aucun (DiT seul)", backend: "—", notes: "LM désactivé ; quantification INT8 + offload CPU complet" },
  { vram: "6–8 Go", dit: "2B turbo", lm: "lm-0.6B", backend: "pt", notes: "LM léger avec backend PyTorch" },
  { vram: "8–16 Go", dit: "2B turbo/sft", lm: "lm-0.6B / 1.7B", backend: "vllm", notes: "0.6B pour 8–12 Go, 1.7B pour 12–16 Go" },
  { vram: "16–20 Go", dit: "2B sft ou XL turbo", lm: "lm-1.7B", backend: "vllm", notes: "XL nécessite un offload CPU sous 20 Go" },
  { vram: "20–24 Go", dit: "XL turbo/sft", lm: "lm-1.7B", backend: "vllm", notes: "XL tient sans offload ; LM 4B disponible" },
  { vram: "≥ 24 Go", dit: "XL sft (xl-base pour extract/lego/complete)", lm: "lm-4B", backend: "vllm", notes: "Meilleure qualité, tout tient sans offload" },
];

export const DEMO_TRACKS = [
  { file: "/demo/neon-skyline.wav", title: "Neon Skyline", genre: "Synthwave", bpm: 110, key: "A minor", ts: "4" },
  { file: "/demo/sunset-boulevard.wav", title: "Sunset Boulevard", genre: "Lo-fi Hip-Hop", bpm: 80, key: "C Major", ts: "4" },
  { file: "/demo/midnight-groove.wav", title: "Midnight Groove", genre: "Funk", bpm: 100, key: "E minor", ts: "4" },
  { file: "/demo/reve-electrique.wav", title: "Rêve Électrique", genre: "Electro House", bpm: 124, key: "F# minor", ts: "4" },
  { file: "/demo/coffee-and-rain.wav", title: "Coffee & Rain", genre: "Ambient", bpm: 70, key: "C Major", ts: "3" },
  { file: "/demo/rock-revival.wav", title: "Rock Revival", genre: "Rock", bpm: 140, key: "E minor", ts: "4" },
];

export const LINKS = {
  github: "https://github.com/ace-step/ACE-Step-1.5",
  acemusic: "https://acemusic.ai/",
  huggingface: "https://huggingface.co/ACE-Step",
  modelscope: "https://modelscope.cn/organization/ACE-Step",
  spaceDemo: "https://huggingface.co/spaces/ACE-Step/ACE-Step-v1-5",
  discord: "https://discord.gg/ace-step",
  technicalReport: "https://arxiv.org/abs/2509.01969",
  awesome: "https://github.com/ace-step/awesome-ace-step",
  vst3: "https://github.com/ace-step/acestep.vst3",
  sidestep: "https://github.com/koda-dernet/Side-Step",
  docs: {
    install: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INSTALL.md",
    api: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/API.md",
    gradio: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/GRADIO_GUIDE.md",
    inference: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INFERENCE.md",
    cli: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/CLI.md",
    tutorial: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md",
    lora: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/LoRA_Training_Tutorial.md",
    gpu: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/GPU_COMPATIBILITY.md",
    benchmark: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/BENCHMARK.md",
    troubleshooting: "https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/GPU_TROUBLESHOOTING.md",
  },
};

// Exemples de descriptions pour le mode Simple (bouton dé)
export const SAMPLE_DESCRIPTIONS = [
  "une chanson d'amour douce en français pour une soirée tranquille",
  "upbeat electronic dance music with heavy bass drops",
  "melancholic indie folk with acoustic guitar",
  "jazz trio playing in a smoky bar",
  "un hymne rock énergique avec chœurs et guitares saturées",
  "chill lo-fi hip-hop beat for studying, vinyl crackle and warm piano",
  "cinematic orchestral trailer music with epic percussion",
  "afrobeat summer hit with catchy guitar riff and joyful vocals",
  "rêverie synthwave nocturne avec nappes analogiques et basse pulsée",
  "mélopée orientale avec oud, qanun et percussions entraînantes",
];

export const EXAMPLE_CAPTIONS = [
  "upbeat pop rock with electric guitars, driving drums, and catchy synth hooks",
  "smooth jazz quartet with saxophone lead, walking bass and brushed drums",
  "dark techno with hypnotic arpeggios and punchy 909 drums",
  "chanson française mélancolique avec accordéon, piano et cordes",
  "epic orchestral score with soaring strings, brass fanfare and choir",
];

export const EXAMPLE_LYRICS = `[Verse 1]
Walking down the street today
Thinking of the words you used to say

[Chorus]
I'm moving on, I'm staying strong
This is where I belong`;

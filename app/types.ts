export type RoomType =
  | "japanese_zen"
  | "brutalist_cube"
  | "neon_corridor"
  | "white_scifi";

export const DEFAULT_ROOM: RoomType = "white_scifi";

export type BreathingRoomConfig = {
  roomImage: string;              // path to static room background
  breathDuration: number;         // seconds for inhale/exhale
  breathIntensity: number;        // scale amount (0.01–0.03)
  lightWarmthShift: number;       // 0–1 (for color temperature shifts)
  brightnessPulse: number;        // 0–1 intensity
  durationHours: number;          // 1–6 hours output
  resolution: "1080p" | "4k";
  audioTrack: string;             // built-in audio
  customAudioFile?: File | null;
  customTemplateName?: string | null;
  customPrompt?: string | null;
  customNegativePrompt?: string | null;
  aiModel?: "flux" | "seedream" | "seedream4";  // AI model used for generation
};

export type RoomStyle = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export type RoomTemplate = {
  name: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  createdAt: string;
  imageUrl?: string; // URL to generated image
  model?: "flux" | "seedream" | "seedream4"; // AI model used
};

export type GenerateRoomRequest = {
  style: string;                 // "zen" | "brutalist" | "neon" | "scifi" | "custom" | dark academia styles
  customPrompt?: string;         // user-defined text
  customNegativePrompt?: string; // optional
  customName?: string;           // name for user-defined template
  saveAsTemplate?: boolean;      // boolean to save new room type
  model?: "flux" | "seedream" | "seedream4";    // AI model selection
};

export type DarkAcademiaConfig = {
  roomImage: string;               // static background
  flickerIntensity: number;        // 0–1 intensity for candle/lamp flicker
  warmthShift: number;             // 0–1 warm grade shift
  vignetteStrength: number;        // dark academia vignette
  dustParticles: boolean;          // floating particles toggle
  ambientMotion: number;           // subtle camera drift (0-0.5)
  durationHours: number;           // 1–10 hours
  resolution: "1080p" | "4k";
  audioTrack: string;              // built-in audio or custom
  customAudioFile?: File | null;
  // Optional quote mode
  showQuotes?: boolean;
  quoteIntervalSeconds?: number;
  quoteList?: string[];
  // AI generation fields
  customTemplateName?: string | null;
  customPrompt?: string | null;
  customNegativePrompt?: string | null;
  aiModel?: "flux" | "seedream" | "seedream4";
};

export type RenderConfig = {
  template: "breathing-room" | "dark-academia-room";
  config: BreathingRoomConfig | DarkAcademiaConfig;
};

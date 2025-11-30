export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "brown_noise",
    name: "Brown Noise",
    url: "/audio/brown-noise.mp3",
    category: "noise",
  },
  {
    id: "white_noise",
    name: "White Noise",
    url: "/audio/white-noise.mp3",
    category: "noise",
  },
  {
    id: "low_hum",
    name: "Low Hum",
    url: "/audio/low-hum.mp3",
    category: "ambient",
  },
  {
    id: "soft_pad_air",
    name: "Soft Pad Air",
    url: "/audio/soft_pad_air.mp3",
    category: "ambient",
  },
  {
    id: "soft_pad_emotional",
    name: "Soft Pad Emotional",
    url: "/audio/soft_pad_emotional.mp3",
    category: "ambient",
  },
];


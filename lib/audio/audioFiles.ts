// ------------------------------------------------------------
// Space Elevator Audio Tracks
// ------------------------------------------------------------

export interface AudioTrack {
  name: string;
  file: string;
}

export const elevatorAudioTracks: AudioTrack[] = [
  {
    name: "Brown Noise",
    file: "/audio/brown-noise.mp3",
  },
  {
    name: "White Noise",
    file: "/audio/white-noise.mp3",
  },
  {
    name: "Low Hum",
    file: "/audio/low-hum.mp3",
  },
  {
    name: "Soft Pad Air",
    file: "/audio/soft_pad_air.mp3",
  },
  {
    name: "Soft Pad Emotional",
    file: "/audio/soft_pad_emotional.mp3",
  },
];


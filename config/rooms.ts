import type { RoomType } from "@/app/types";

export type RoomConfig = {
  name: string;
  roomImage: string;
  filterType: "infinite_lift";
  brightnessBoost: number;
  liftSpeed: number;
};

export const roomConfigs: Record<RoomType, RoomConfig> = {
  japanese_zen: {
    name: "Japanese Zen Room",
    roomImage: "/assets/rooms/zen-room.jpg",
    filterType: "infinite_lift",
    brightnessBoost: 0.08,
    liftSpeed: 0.02,
  },
  brutalist_cube: {
    name: "Brutalist Concrete Cube",
    roomImage: "/assets/rooms/brutalist-cube.jpg",
    filterType: "infinite_lift",
    brightnessBoost: 0.10,
    liftSpeed: 0.025,
  },
  neon_corridor: {
    name: "Neon Corridor",
    roomImage: "/assets/rooms/neon-corridor.jpg",
    filterType: "infinite_lift",
    brightnessBoost: 0.15,
    liftSpeed: 0.03,
  },
  white_scifi: {
    name: "White Sci-Fi Room",
    roomImage: "/assets/rooms/scifi-room.jpg",
    filterType: "infinite_lift",
    brightnessBoost: 0.12,
    liftSpeed: 0.03,
  },
};


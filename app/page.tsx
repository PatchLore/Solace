"use client";

import { useRouter } from "next/navigation";
import { roomConfigs } from "@/config/rooms";
import type { RoomType } from "./types";

const rooms: Array<{ id: RoomType; name: string; image: string; description: string }> = [
  {
    id: "japanese_zen",
    name: roomConfigs.japanese_zen.name,
    image: roomConfigs.japanese_zen.roomImage,
    description: "Minimalist zen space with natural light",
  },
  {
    id: "brutalist_cube",
    name: roomConfigs.brutalist_cube.name,
    image: roomConfigs.brutalist_cube.roomImage,
    description: "Raw concrete architecture with geometric shadows",
  },
  {
    id: "neon_corridor",
    name: roomConfigs.neon_corridor.name,
    image: roomConfigs.neon_corridor.roomImage,
    description: "Cyberpunk-inspired hallway with neon accents",
  },
  {
    id: "white_scifi",
    name: roomConfigs.white_scifi.name,
    image: roomConfigs.white_scifi.roomImage,
    description: "Futuristic white space with clean lines",
  },
];

// Elevator room (special case, not in roomConfigs)
const elevatorRooms = [
  {
    id: "elevator_1",
    name: "Elevator Space Room 1",
    elevatorImage: "/elevators/Elevator1.jpg",
    description: "Elevator with animated background",
  },
  {
    id: "elevator_2",
    name: "Elevator Space Room 2",
    elevatorImage: "/elevators/Elevator2.jpg",
    description: "Elevator with animated background",
  },
];

// Space Elevator template
const spaceElevatorRoom = {
  id: "space-elevator",
  name: "Space Elevator",
  image: "/assets/rooms/scifi-room.jpg", // Reuse sci-fi thumbnail for now
  description: "Futuristic elevator drifting through deep space",
};

export default function HomePage() {
  const router = useRouter();

  const handleRoomSelect = (roomId: RoomType) => {
    router.push(`/editor?room=${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          SOLACE Rooms
        </h1>
        <p className="text-xl text-gray-300 mb-12 text-center">
          Choose your ambient space
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer transform transition hover:scale-105 hover:shadow-2xl pointer-events-auto"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRoomSelect(room.id);
                }
              }}
            >
              <div className="aspect-video relative pointer-events-none">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
              <div className="p-4 pointer-events-none">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {room.name}
                </h3>
                <p className="text-gray-400 text-sm">{room.description}</p>
              </div>
            </div>
          ))}
          {/* Space Elevator Card */}
          <div
            onClick={() => router.push(`/editor?template=space-elevator`)}
            className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer transform transition hover:scale-105 hover:shadow-2xl pointer-events-auto"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/editor?template=space-elevator`);
              }
            }}
          >
            <div className="aspect-video relative pointer-events-none">
              <img
                src={spaceElevatorRoom.image}
                alt={spaceElevatorRoom.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </div>
            <div className="p-4 pointer-events-none">
              <h3 className="text-xl font-semibold text-white mb-2">
                {spaceElevatorRoom.name}
              </h3>
              <p className="text-gray-400 text-sm">{spaceElevatorRoom.description}</p>
            </div>
          </div>
        </div>

        {/* Elevator Rooms Section */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Elevator Spaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {elevatorRooms.map((elevator) => (
              <div
                key={elevator.id}
                onClick={() => router.push(`/editor?room=${elevator.id}&type=elevator`)}
                className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer transform transition hover:scale-105 hover:shadow-2xl pointer-events-auto"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/editor?room=${elevator.id}&type=elevator`);
                  }
                }}
              >
                <div className="aspect-video relative pointer-events-none">
                  <img
                    src={elevator.elevatorImage}
                    alt={elevator.name}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
                <div className="p-4 pointer-events-none">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {elevator.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{elevator.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

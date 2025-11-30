# SOLACE — Breathing Room Generator

A Next.js 15 application for generating long-form ambient "breathing" room videos (1–6 hours) with customizable breathing animations, lighting effects, and ambient audio.

## Features

- 🏠 **4 Room Styles**: Japanese Zen Room, Brutalist Concrete Cube, Neon Corridor, White Sci-Fi Room
- 🫁 **Breathing Animation**: Subtle scale animations (1–3%) with customizable duration (2–8s)
- 💡 **Lighting Controls**: Warmth shift and brightness pulse effects
- 🔊 **Audio Engine**: Built-in ambient tracks (brown noise, white noise, low hum, soft pad) + custom audio upload
- 🎬 **High-Quality Export**: 1080p @ 30fps or 4K @ 30fps MP4 output
- ⚡ **Real-Time Preview**: Canvas-based preview with GPU-accelerated animations
- 🧪 **Test Mode**: Quick 10-second preview renders for testing

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **FFmpeg** (server-side video processing)
- **Canvas API** (preview animations)
- **Runware API** (text-to-image generation with Flux/Seedream)

## Getting Started

### Prerequisites

- Node.js 18+ 
- FFmpeg installed on your system
- Runware API key (for custom room generation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Runware API key:
```
RUNWARE_API_KEY=your_runware_api_key_here
```

Get your API key from [Runware.ai](https://runware.ai)

2. Add room images to `public/assets/rooms/`:
   - `zen-room.jpg`
   - `brutalist-cube.jpg`
   - `neon-corridor.jpg`
   - `scifi-room.jpg`

3. Add audio tracks to `audio/`:
   - `brown-noise.mp3`
   - `white-noise.mp3`
   - `low-hum.mp3`
   - `soft-pad.mp3`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
solace-breathing-room/
├── app/
│   ├── api/
│   │   ├── render/          # Main render endpoint
│   │   └── render-test/     # Test render endpoint (10s)
│   ├── editor/              # Editor page
│   ├── page.tsx             # Home page
│   ├── types.ts             # TypeScript types
│   └── layout.tsx           # Root layout
├── components/
│   └── canvas/
│       └── BreathingRoomPreview.tsx  # Real-time preview
├── templates/
│   └── breathing-room.ts    # Template engine
├── assets/
│   └── rooms/               # Room background images
├── audio/                   # Built-in audio tracks
└── tmp/                     # Temporary render output
```

## Usage

1. **Select a Room**: Choose from 4 room styles on the home page
2. **Open Editor**: Click "Open Editor" to access the workspace
3. **Customize**:
   - Adjust breathing duration and intensity
   - Control lighting warmth and brightness pulse
   - Select or upload audio
   - Choose video duration (1–6 hours) and resolution
4. **Preview**: Real-time canvas preview updates as you adjust controls
5. **Render**: Click "Render Video" to generate the final MP4

## Future Templates

The architecture is designed to support additional scene templates:
- Infinite Elevator (Lift)
- Particle Worlds
- Liquid Architecture
- Microscopic Worlds
- Nebula Aquarium
- Portal Loops
- Waiting Room at the Edge of Reality

Each template follows the same pattern: `generateTimeline` → `prepareFFmpegFilters` → `render` → `return file`

## Notes

- Long renders (1–6 hours) are memory-efficient using FFmpeg's streaming approach
- Test mode renders 10-second previews for quick iteration
- All renders are saved temporarily and streamed to the client
- FFmpeg filters handle breathing animation, brightness, and color temperature in real-time

## License

ISC


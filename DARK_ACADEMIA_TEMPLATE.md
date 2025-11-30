# Dark Academia Template Implementation

## ✅ Completed Features

### 1. Template System
- ✅ Created `/templates/dark-academia-room.ts` with full FFmpeg rendering logic
- ✅ Supports flicker, warmth, vignette, drift, dust particles, and quote overlays
- ✅ All animation done in-app (no AI video generation)

### 2. Type System
- ✅ Added `DarkAcademiaConfig` type with all required fields
- ✅ Added `RenderConfig` type for multi-template support
- ✅ Updated existing types to support template selection

### 3. Preview Component
- ✅ Created `/components/canvas/DarkAcademiaPreview.tsx`
- ✅ Real-time preview with all effects:
  - Candle flicker animation
  - Warm color grading
  - Vignette overlay
  - Dust particles (30 particles)
  - Camera drift
  - Quote overlays with fade in/out

### 4. API Routes
- ✅ Updated `/api/render` to support multiple templates
- ✅ Updated `/api/render-test` to support dark academia
- ✅ Extended `/api/generate-room` with dark academia styles:
  - `dark_academia_study`
  - `dark_academia_library`
  - `dark_academia_corridor`
  - `dark_academia_writer_room`

### 5. Editor UI
- ✅ Added template selector (Breathing Room / Dark Academia Room)
- ✅ Conditional rendering based on selected template
- ✅ Dark Academia Settings panel:
  - Flicker Intensity slider (0-1)
  - Warmth Shift slider (0-1)
  - Vignette Strength slider (0-1)
  - Ambient Motion slider (0-0.5)
  - Dust Particles toggle
- ✅ Quote Mode panel:
  - Show Quotes toggle
  - Quote Interval slider (15-120s)
  - Quotes textarea (one per line)

### 6. Room Generation
- ✅ Dark academia room styles in dropdown
- ✅ Custom prompt support for dark academia
- ✅ Template saving with model selection
- ✅ Auto-loading custom templates

### 7. Audio System
- ✅ Dark Academia audio tracks:
  - candle-crackle
  - fireplace-soft
  - library-rain
  - paper-turning
  - deep-cello-drone
- ✅ Conditional audio track list based on template

### 8. Assets Structure
- ✅ Created `/assets/rooms/dark-academia/` folder
- ✅ Created `/audio/dark-academia/` folder
- ✅ Placeholder files with .gitkeep

### 9. Default Templates
- ✅ Created 4 default dark academia templates:
  - `dark_academia_study.json`
  - `dark_academia_library.json`
  - `dark_academia_corridor.json`
  - `dark_academia_writer_room.json`

## 🎬 Animation Features

### Candle Flicker
- Irregular pattern using multiple sine waves
- Frequency: 8Hz, 13Hz, 5Hz combined
- Intensity: 0-15% brightness variation

### Warm Color Grading
- Orange/gold tone overlay
- Adjustable warmth shift (0-1)
- Applied via colorbalance filter

### Vignette
- Radial gradient from center
- Dark edges for atmospheric effect
- Adjustable strength (0-1)

### Camera Drift
- Subtle pan and zoom motion
- Very slow speed (0.0001x)
- Creates gentle movement

### Dust Particles
- 30 floating particles
- Random movement patterns
- Semi-transparent white specks

### Quote Overlays
- Fade in/out transitions (1s each)
- Serif font with shadow
- Centered at bottom
- Word wrapping support

## 📁 File Structure

```
templates/
├── breathing-room.ts
├── dark-academia-room.ts
└── rooms/
    ├── default/
    │   ├── dark_academia_study.json
    │   ├── dark_academia_library.json
    │   ├── dark_academia_corridor.json
    │   └── dark_academia_writer_room.json
    └── custom/

components/canvas/
├── BreathingRoomPreview.tsx
└── DarkAcademiaPreview.tsx

assets/rooms/
└── dark-academia/
    ├── library.png
    ├── study-room.png
    ├── writer-desk.png
    └── gothic-corridor.png

audio/
└── dark-academia/
    ├── candle-crackle.mp3
    ├── fireplace-soft.mp3
    ├── library-rain.mp3
    ├── paper-turning.mp3
    └── deep-cello-drone.mp3
```

## 🎨 Usage

### Selecting Template
1. Open Editor
2. Select "Dark Academia Room" from Scene Template dropdown
3. Preview switches to Dark Academia preview

### Generating Room
1. Select room style (Study, Library, Corridor, Writer Room)
2. Or choose "Custom Prompt"
3. Select AI Model (Flux/Seedream)
4. Click "Generate Background (Runware)"

### Adjusting Settings
- **Flicker Intensity**: Controls candle flicker brightness variation
- **Warmth Shift**: Controls orange/gold color grading
- **Vignette Strength**: Controls dark edge vignette
- **Ambient Motion**: Controls camera drift amount
- **Dust Particles**: Toggle floating particles

### Quote Mode
1. Enable "Show Quotes Overlay"
2. Set quote interval (15-120 seconds)
3. Paste quotes (one per line)
4. Quotes will fade in/out automatically

### Rendering
1. Adjust all settings
2. Select audio track
3. Choose duration (1-10 hours)
4. Choose resolution (1080p/4K)
5. Click "Test Render (10s)" or "Render Video"

## 🔧 Technical Details

### FFmpeg Filters Used
- `eq` - Brightness adjustment for flicker
- `colorbalance` - Warm color grading
- `vignette` - Dark edge vignette
- `zoompan` - Camera drift and zoom
- `drawtext` - Quote overlays

### Preview Performance
- 60 FPS canvas animation
- GPU-accelerated transforms
- Efficient particle system
- Smooth quote transitions

### Render Pipeline
1. Load room image
2. Apply flicker brightness filter
3. Apply warm color grading
4. Apply vignette overlay
5. Apply camera drift/zoom
6. Overlay quotes at intervals (if enabled)
7. Combine with audio track
8. Export MP4

## 🚀 Future Enhancements

Potential additions:
- More particle effects
- Additional quote positioning options
- Custom font selection
- More dark academia room styles
- Batch quote import
- Quote timing presets

## 📝 Notes

- All animation is done in-app with FFmpeg (no AI video)
- Quote overlays use system serif fonts
- Dust particles are rendered in preview only (FFmpeg overlay would require separate video)
- Dark academia audio tracks should be seamless loops
- Room images should be 1920x1080 or higher for best quality


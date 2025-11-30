# Migration from Runway to Runware

## Summary

Successfully migrated from Runway API to Runware API for text-to-image generation.

## Changes Made

### 1. API Route (`/app/api/generate-room/route.ts`)
- ✅ Removed Runway API URL and model constants
- ✅ Replaced with Runware API endpoint: `https://api.runware.ai/v1/image`
- ✅ Updated authentication header: `X-Runware-Api-Key` (instead of `Authorization: Bearer`)
- ✅ Updated request payload structure for Runware format
- ✅ Updated response parsing (Runware returns `{ "images": ["<base64>"] }`)
- ✅ Added model selection support (Flux/Seedream)

### 2. Types (`/app/types.ts`)
- ✅ Added `aiModel?: "flux" | "seedream"` to `BreathingRoomConfig`
- ✅ Added `model?: "flux" | "seedream"` to `RoomTemplate`
- ✅ Added `model?: "flux" | "seedream"` to `GenerateRoomRequest`

### 3. Editor UI (`/app/editor/page.tsx`)
- ✅ Added AI Model dropdown (Flux/Seedream selection)
- ✅ Model selector disabled when using saved templates (locked to template's model)
- ✅ Updated button text: "Generate Background (Runware)"
- ✅ Updated loading text: "Generating with Runware (Flux/Seedream)..."
- ✅ Added model to request body
- ✅ Added model to config state
- ✅ Template loading now preserves model selection

### 4. Templates
- ✅ Updated all default templates to include `model` field:
  - `zen.json` → `"model": "flux"`
  - `brutalist.json` → `"model": "flux"`
  - `neon.json` → `"model": "seedream"`
  - `scifi.json` → `"model": "flux"`
- ✅ Custom template saving now includes model field

### 5. Documentation
- ✅ Created `RUNWARE_INTEGRATION.md` (replaced `RUNWAY_INTEGRATION.md`)
- ✅ Updated `README.md` with Runware references
- ✅ Updated `FEATURES.md` with Runware integration details
- ✅ Removed all Runway references

## Model Mapping

### Flux (`black-forest-labs/FLUX.1-dev`)
- **Use for:** Stable, cinematic rooms
- **Default for:** Zen, Brutalist, Sci-Fi

### Seedream XL (`cagliostrolab/seedream2-xl`)
- **Use for:** Atmospheric, environmental vibes
- **Default for:** Neon Corridor

## API Changes

### Request Format
**Before (Runway):**
```json
{
  "model": "runway-gen3",
  "prompt": "...",
  "negative_prompt": "...",
  "steps": 40,
  "width": 1920,
  "height": 1080
}
```

**After (Runware):**
```json
{
  "model": "black-forest-labs/FLUX.1-dev",
  "prompt": "...",
  "negative_prompt": "...",
  "width": 1920,
  "height": 1080,
  "guidance": 7.5,
  "steps": 30
}
```

### Response Format
**Before (Runway):**
```json
{
  "data": [{
    "b64_json": "..."
  }]
}
```

**After (Runware):**
```json
{
  "images": ["<base64 image>"]
}
```

### Authentication
**Before:** `Authorization: Bearer ${apiKey}`  
**After:** `X-Runware-Api-Key: ${apiKey}`

## Environment Variables

**Before:**
```
RUNWAY_API_KEY=...
RUNWAY_API_URL=...
RUNWAY_MODEL_ID=...
```

**After:**
```
RUNWARE_API_KEY=...
```

## Key Features Preserved

✅ All animation remains in-app (FFmpeg)  
✅ Template system unchanged  
✅ Custom prompt support  
✅ Negative prompt support  
✅ Template saving/loading  
✅ Image generation workflow  

## Breaking Changes

⚠️ **Environment Variable:** `RUNWAY_API_KEY` → `RUNWARE_API_KEY`  
⚠️ **API Endpoint:** Changed from Runway to Runware  
⚠️ **Model IDs:** Changed from Runway models to Flux/Seedream  

## Testing Checklist

- [ ] Set `RUNWARE_API_KEY` in `.env.local`
- [ ] Test Flux model generation
- [ ] Test Seedream model generation
- [ ] Test custom prompt generation
- [ ] Test template saving with model
- [ ] Test template loading preserves model
- [ ] Verify images save correctly
- [ ] Verify preview updates correctly
- [ ] Test render pipeline with generated images

## Notes

- All animation (breathing, lighting, etc.) is still done in-app with FFmpeg
- Runware only generates static images
- Model selection is preserved in templates
- Default templates have model preferences set


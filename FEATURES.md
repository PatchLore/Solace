# SOLACE Breathing Room Generator - Features

## ✅ Completed Features

### Core Breathing Room Generator
- ✅ Next.js 15 App Router with TypeScript
- ✅ Real-time canvas preview with breathing animations
- ✅ Customizable breathing duration (2-8s) and intensity (1-3%)
- ✅ Lighting controls (warmth shift, brightness pulse)
- ✅ Audio engine (built-in tracks + custom upload)
- ✅ High-quality video export (1080p/4K @ 30fps)
- ✅ Test render mode (10-second previews)

### Runware AI Integration ✨ NEW
- ✅ **Unlimited Custom Room Prompts** - Generate any room style
- ✅ **Model Selection** - Choose Flux (stable) or Seedream XL (atmospheric)
- ✅ **Custom Negative Prompts** - Control generation output
- ✅ **Template Saving System** - Save custom rooms as reusable templates
- ✅ **Auto-Loading Templates** - Custom templates appear automatically
- ✅ **JSON-Based Storage** - Portable, editable template format
- ✅ **Image URL Storage** - Templates remember their generated images
- ✅ **Image-Only Generation** - All animation done in-app with FFmpeg

## 🎨 Room Generation Workflow

1. **Select Room Style**
   - Choose from 4 built-in styles
   - Or select "Custom Prompt"
   - Or pick from your saved custom templates

2. **Custom Generation** (if selected)
   - Enter your prompt
   - Optionally add negative prompt
   - Name your template (optional)
   - Choose to save as template
   - Click "Generate Background"

3. **Use Generated Room**
   - Generated image loads into preview
   - Adjust breathing and lighting
   - Render your video

## 📁 File Structure

```
templates/
├── rooms/
│   ├── default/          # Built-in room templates
│   │   ├── zen.json
│   │   ├── brutalist.json
│   │   ├── neon.json
│   │   └── scifi.json
│   └── custom/           # User-generated templates
│       ├── My-Library.json
│       └── Dream-Room.json

public/
└── generated/
    └── rooms/            # Generated room images
        └── generated-room-*.png
```

## 🔧 API Endpoints

### POST `/api/generate-room`
Generate a new room using Runway AI.

**Request:**
```json
{
  "style": "custom",
  "customPrompt": "minimalist library...",
  "customNegativePrompt": "people, text",
  "customName": "My Library",
  "saveAsTemplate": true
}
```

**Response:**
```json
{
  "url": "/generated/rooms/generated-room-123.png",
  "templateSaved": true,
  "templateName": "My-Library"
}
```

### GET `/api/templates`
Load all custom templates.

**Response:**
```json
{
  "templates": [
    {
      "name": "My Library",
      "prompt": "...",
      "negativePrompt": "...",
      "style": "custom",
      "createdAt": "2024-01-01T00:00:00Z",
      "imageUrl": "/generated/rooms/..."
    }
  ]
}
```

## 🎯 Template Format

Custom templates are stored as JSON:

```json
{
  "name": "My Dream Room",
  "prompt": "your prompt here",
  "negativePrompt": "optional negative prompt",
  "style": "custom",
  "createdAt": "2024-01-01T00:00:00Z",
  "imageUrl": "/generated/rooms/generated-room-123.png"
}
```

## 🚀 Usage Examples

### Generate a Custom Room
1. Select "Custom Prompt" from Room Style
2. Enter: "minimalist library with warm lighting, bookshelves, cozy atmosphere"
3. Negative: "people, text, cluttered"
4. Name: "Cozy Library"
5. Check "Save as template"
6. Generate

### Use a Saved Template
1. Select template from "Your Custom Rooms" section
2. Image loads automatically
3. Adjust breathing/lighting
4. Render video

### Edit Template (Manual)
1. Navigate to `/templates/rooms/custom/`
2. Edit JSON file
3. Refresh editor page
4. Template updates automatically

## 🔐 Environment Setup

Required environment variables (`.env.local`):

```env
RUNWAY_API_KEY=your_api_key_here
RUNWAY_API_URL=https://api.runwayml.com/v1/images/generations
RUNWAY_MODEL_ID=runway-gen3
```

## 📝 Notes

- Generated images are saved to `/public/generated/rooms/`
- Templates are automatically loaded on page refresh
- Image URLs are stored in templates for quick access
- Custom templates support unlimited creation
- All templates are JSON-based and portable

## 🎬 Next Steps

The system is ready for:
- ✅ Custom room generation
- ✅ Template management
- ✅ Video rendering with custom rooms
- 🔜 Future: Template sharing/export
- 🔜 Future: Batch generation
- 🔜 Future: Image editing


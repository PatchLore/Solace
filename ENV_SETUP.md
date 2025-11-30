# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with:

```
PORT=3003
FFMPEG_PATH=/usr/local/bin/ffmpeg
RUNWARE_API_KEY=
```

- `PORT=3003` - Ensures the dev server always runs on port 3003
- `FFMPEG_PATH=/usr/local/bin/ffmpeg` - Forces use of FFmpeg 6.1.1 (not the old MacPorts version)
- `RUNWARE_API_KEY` - Used by the `/api/generate-room` route for AI image generation

## FFmpeg

FFmpeg must be installed at: `/usr/local/bin/ffmpeg` (FFmpeg 6.1.1 or later)

The render API explicitly uses `/usr/local/bin/ffmpeg` and will NOT use PATH to avoid the old MacPorts version at `/opt/local/bin/ffmpeg`.

### ⚠️ IMPORTANT: Disable MacPorts FFmpeg

**Do NOT use the MacPorts version at `/opt/local/bin/ffmpeg`** — it will cause filter_complex failures.

If you have MacPorts FFmpeg installed, disable it by running:

```bash
sudo mv /opt/local/bin/ffmpeg /opt/local/bin/ffmpeg_backup
```

The app will detect and refuse to start if MacPorts FFmpeg is present.

### Installation

To install the correct FFmpeg snapshot:

```bash
npm run install-ffmpeg
```

This will:
- Extract and install FFmpeg to `/usr/local/bin/ffmpeg`
- Remove quarantine flags
- Validate the installation
- Update `.env.local`


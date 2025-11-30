# Audio Looping Implementation

## ✅ Changes Made

### `/app/api/render/route.ts`

Updated the render route to automatically loop audio files from `/public/audio` to match the total render duration.

### Key Features

1. **Infinite Audio Looping**
   - Uses `-stream_loop -1` to loop audio files infinitely
   - Works with 1-minute audio loops
   - Expands to any duration (1-6 hours) without generating large files

2. **Duration Synchronization**
   - Uses `-t ${totalSeconds}` to set exact output duration
   - Uses `-shortest` flag to ensure video and audio stop together
   - Prevents audio overrun or underrun

3. **Audio Path Handling**
   - Supports `/audio/` paths (e.g., `/audio/brown-noise.mp3`)
   - Automatically constructs full path to `/public/audio/`
   - Handles both relative and absolute paths

### FFmpeg Command Structure

```bash
ffmpeg -y \
  -loop 1 -i image.jpg \
  -stream_loop -1 -i audio.mp3 \
  -t TOTAL_SECONDS \
  -filter_complex "[0:v]filters[v]" \
  -map "[v]" \
  -map 1:a \
  -shortest \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output.mp4
```

### How It Works

1. **Image Input**: `-loop 1` loops the image frame infinitely
2. **Audio Input**: `-stream_loop -1` loops the audio file infinitely
3. **Duration**: `-t` sets the exact output duration (e.g., 3600 seconds for 1 hour)
4. **Synchronization**: `-shortest` ensures both streams stop at the same time
5. **Encoding**: Video and audio are encoded with specified codecs and settings

### Benefits

- ✅ No need to generate large audio files (1-minute loops work for hours)
- ✅ Perfect synchronization between video and audio
- ✅ Memory efficient (no large audio files on disk)
- ✅ Works with any duration (1 hour to 6 hours)

### Testing

Test with:
- **10-second test render**: Verify audio loops correctly
- **1-hour render**: Verify audio loops for full duration
- **3-hour render**: Verify audio loops for extended duration

### Audio File Requirements

- Place 1-minute seamless loops in `/public/audio/`
- Supported formats: MP3, WAV, AAC
- Files should be seamless loops (no gaps or clicks)
- Recommended: 192kbps AAC or MP3

### Example Audio Files

- `brown-noise.mp3` (1-minute loop)
- `white-noise.mp3` (1-minute loop)
- `low-hum.mp3` (1-minute loop)
- `soft-pad.mp3` (1-minute loop)

Each file will automatically loop to match the render duration.


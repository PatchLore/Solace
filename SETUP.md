# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install FFmpeg:**
   
   **macOS:**
   ```bash
   brew install ffmpeg
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install ffmpeg
   ```
   
   **Windows:**
   Download from https://ffmpeg.org/download.html and add to PATH

3. **Add room images:**
   
   Place your room images in `public/assets/rooms/`:
   - `zen-room.jpg` (1920x1080 or higher)
   - `brutalist-cube.jpg`
   - `neon-corridor.jpg`
   - `scifi-room.jpg`
   
   Or run the placeholder script:
   ```bash
   npm run setup-placeholders
   ```

4. **Add audio tracks (optional):**
   
   Place ambient audio files in `audio/`:
   - `brown-noise.mp3`
   - `white-noise.mp3`
   - `low-hum.mp3`
   - `soft-pad.mp3`
   
   These should be seamless loops for best results.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to http://localhost:3000

## Room Image Requirements

- **Resolution:** 1920x1080 minimum (3840x2160 for 4K renders)
- **Format:** JPG or PNG
- **Aspect Ratio:** 16:9
- **Content:** Minimal room scenes that work well with subtle breathing animations

## Audio Requirements

- **Format:** MP3, WAV, or AAC
- **Length:** Can be short loops (10-60 seconds) - will be automatically looped
- **Bitrate:** 192kbps recommended
- **Type:** Ambient, seamless loops work best

## Testing

Use the "Test Render (10s)" button in the editor to quickly test your configuration before rendering long videos.

## Troubleshooting

### FFmpeg not found
- Ensure FFmpeg is installed and in your PATH
- On macOS, verify with: `which ffmpeg`
- The app will try to use `@ffmpeg-installer/ffmpeg` if available, otherwise uses system FFmpeg

### Room images not loading
- Check that images are in `public/assets/rooms/`
- Verify file names match exactly (case-sensitive)
- Check browser console for CORS errors

### Render fails
- Check server logs for FFmpeg errors
- Ensure sufficient disk space in `/tmp` directory
- For long renders (6 hours), ensure adequate system memory

### Audio not working
- Verify audio file format is supported
- Check that audio files are in the `audio/` directory
- Custom audio uploads should be valid audio files


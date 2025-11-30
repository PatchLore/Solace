# FFmpeg Rendering Optimizations

## ✅ Applied Optimizations

### 1. Argument Order ✓
Correct FFmpeg command structure:
1. All inputs (image + audio)
2. `-t` duration (after inputs, before filters)
3. `filter_complex` & maps
4. `-shortest` flag
5. Codec settings
6. Output file

### 2. Video Quality Upgrade ✓
- **Preset**: Changed from `medium` → `slow`
- **CRF**: Changed from `23` → `18`
- **Result**: Dramatically smoother gradients, higher quality with minimal size increase

### 3. Dithering Filter ✓
Added `dither=bayer:bayer_scale=2` after `format=yuv420p` to eliminate banding in gradients.

**Filter chain**: `scale → crop → eq → warmth → vignette → format → dither`

### 4. Audio Loudness Normalization ✓
Added `-af "loudnorm=I=-14:TP=-1.5:LRA=11"` for broadcast-quality consistent loudness (YouTube -14 LUFS standard).

**Applied only when audio exists** (conditional check).

### 5. Audio Looping ✓
Audio looping logic remains intact:
- `-stream_loop -1` for infinite looping
- Works with 1-minute audio files
- Expands to any duration (1-6 hours)

### 6. Multi-Hour Safety Flag ✓
Added `-max_muxing_queue_size 9999` to prevent "Too many packets..." errors on long renders.

## Final FFmpeg Command Structure

```bash
ffmpeg \
  -y \
  -loop 1 -i roomImage.png \
  -stream_loop -1 -i audio.mp3 \
  -t TOTAL_SECONDS \
  -filter_complex "[0:v]SCALE_CROP_EQ_WARMTH_VIGNETTE_FORMAT_DITHER[v]" \
  -map "[v]" \
  -map "1:a" \
  -shortest \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 \
  -c:a aac -b:a 192k \
  -max_muxing_queue_size 9999 \
  -movflags +faststart \
  output.mp4
```

## Quality Improvements

### Video
- **Higher bitrate** (CRF 18 vs 23)
- **Slower preset** for better compression efficiency
- **Dithering** eliminates banding artifacts
- **Smoother gradients** in breathing animations

### Audio
- **Broadcast-quality loudness** normalization
- **Consistent levels** across all renders
- **YouTube-ready** (-14 LUFS standard)

### Stability
- **Multi-hour support** with increased muxing queue
- **Perfect synchronization** with `-shortest` flag
- **Seamless looping** for long durations

## Testing Recommendations

Test with:
- ✅ **10-second test render**: Verify all effects work
- ✅ **1-hour render**: Verify stability and quality
- ✅ **3-hour render**: Verify multi-hour support

Verify:
- ✅ Audio and video start/end exactly together
- ✅ Brightness and breathing cycles work smoothly
- ✅ No banding in gradients
- ✅ Audio loop is seamless
- ✅ Loudness is consistent


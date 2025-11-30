import type { DarkAcademiaConfig } from "@/app/types";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs/promises";

// Set FFmpeg path
try {
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (err) {
  console.warn("FFmpeg installer not found, using system FFmpeg");
}

export interface DarkAcademiaTimelineFrame {
  time: number;
  brightness: number;      // flicker brightness
  warmth: number;          // warmth shift
  vignette: number;        // vignette opacity
  driftX: number;          // camera drift X
  driftY: number;          // camera drift Y
  zoom: number;            // subtle zoom
}

/**
 * Generate animation timeline for dark academia room
 */
export function generateDarkAcademiaTimeline(config: DarkAcademiaConfig): DarkAcademiaTimelineFrame[] {
  const totalDuration = config.durationHours * 3600;
  const fps = config.resolution === "4k" ? 30 : 30;
  const totalFrames = Math.floor(totalDuration * fps);
  const frames: DarkAcademiaTimelineFrame[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    
    // Candle flicker - irregular pattern (multiple frequencies)
    const flicker1 = Math.sin(time * 8) * 0.3;
    const flicker2 = Math.sin(time * 13) * 0.2;
    const flicker3 = Math.sin(time * 5) * 0.1;
    const flicker = (flicker1 + flicker2 + flicker3) / 3;
    const brightness = 1.0 + flicker * config.flickerIntensity * 0.15;
    
    // Warmth shift (constant warm tone)
    const warmth = config.warmthShift;
    
    // Vignette strength (constant)
    const vignette = config.vignetteStrength;
    
    // Subtle camera drift (slow pan/zoom)
    const driftSpeed = 0.0001; // Very slow
    const driftX = Math.sin(time * driftSpeed) * config.ambientMotion * 0.01;
    const driftY = Math.cos(time * driftSpeed * 0.7) * config.ambientMotion * 0.01;
    const zoom = 1.0 + Math.sin(time * driftSpeed * 0.5) * config.ambientMotion * 0.005;

    frames.push({
      time,
      brightness,
      warmth,
      vignette,
      driftX,
      driftY,
      zoom,
    });
  }

  return frames;
}

/**
 * Render dark academia room video using FFmpeg
 */
export async function renderDarkAcademiaRoom(
  config: DarkAcademiaConfig,
  roomImagePath: string,
  audioPath: string | null,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const totalDuration = config.durationHours * 3600;
    const width = config.resolution === "4k" ? 3840 : 1920;
    const height = config.resolution === "4k" ? 2160 : 1080;
    const fps = 30;

    // Build filter complex for dark academia effects
    const filters: string[] = [];

    // Initial scale to resolution
    filters.push(`scale=${width}:${height}`);

    // Candle flicker brightness
    const flickerExpr = `1+${config.flickerIntensity * 0.15}*(sin(8*t)*0.3+sin(13*t)*0.2+sin(5*t)*0.1)/3`;
    filters.push(`eq=brightness=${flickerExpr}:contrast=1.0`);

    // Warm color grading (orange/gold tones)
    const warmth = config.warmthShift;
    filters.push(`colorbalance=rs=${warmth * 0.3}:gs=${warmth * 0.15}:bs=${-warmth * 0.1}`);

    // Subtle camera drift (pan and zoom)
    const driftAmount = config.ambientMotion * 0.01;
    const panX = `${width/2}+${width}*${driftAmount}*sin(0.0001*t)`;
    const panY = `${height/2}+${height}*${driftAmount}*cos(0.00007*t)`;
    const zoom = `1+${config.ambientMotion * 0.005}*sin(0.00005*t)`;
    filters.push(`zoompan=z='${zoom}':x='${panX}':y='${panY}':d=1:s=${width}x${height}`);

    // Vignette overlay
    if (config.vignetteStrength > 0) {
      const vignetteOpacity = config.vignetteStrength * 0.5;
      filters.push(`vignette=angle=PI/4:start=0.5:stop=0.9:color=0x000000:alpha=${vignetteOpacity}`);
    }

    // Dust particles overlay (if enabled)
    // Note: FFmpeg doesn't have native particle effects, so we'll use a simple overlay
    // For a full implementation, you'd need to generate a particle video overlay separately
    // For now, we'll skip this and handle it in the preview component

    const videoFilter = filters.join(",");

    let command = ffmpeg(roomImagePath)
      .inputOptions([
        "-loop", "1",
        "-framerate", fps.toString(),
        "-t", totalDuration.toString(),
      ])
      .videoFilters(videoFilter)
      .outputOptions([
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-r", fps.toString(),
        "-t", totalDuration.toString(),
      ]);

    // Add audio if provided
    if (audioPath) {
      command = command
        .input(audioPath)
        .inputOptions([
          "-stream_loop", "-1",
        ])
        .outputOptions([
          "-c:a", "aac",
          "-b:a", "192k",
          "-shortest",
        ]);
    } else {
      command = command.outputOptions(["-an"]); // No audio
    }

    // Add quote overlays if enabled
    if (config.showQuotes && config.quoteList && config.quoteList.length > 0) {
      const quoteInterval = config.quoteIntervalSeconds || 30;
      const quoteFilters: string[] = [];
      
      config.quoteList.forEach((quote, index) => {
        const startTime = index * quoteInterval;
        const endTime = startTime + 5; // Show quote for 5 seconds
        
        if (startTime < totalDuration) {
          // Create text overlay with fade in/out
          const fadeIn = 1; // 1 second fade in
          const fadeOut = 1; // 1 second fade out
          
          quoteFilters.push(
            `drawtext=text='${quote.replace(/'/g, "\\'")}':` +
            `fontfile=/System/Library/Fonts/Supplemental/Times New Roman.ttf:` +
            `fontsize=48:` +
            `fontcolor=0xFFF8E7:` +
            `x=(w-text_w)/2:` +
            `y=h-th-100:` +
            `shadowcolor=0x000000:` +
            `shadowx=2:` +
            `shadowy=2:` +
            `enable='between(t,${startTime},${startTime + fadeIn})':` +
            `alpha='if(lt(t,${startTime + fadeIn}),(t-${startTime})/${fadeIn},` +
            `if(lt(t,${endTime - fadeOut}),1,(${endTime}-t)/${fadeOut}))'`
          );
        }
      });
      
      if (quoteFilters.length > 0) {
        // Apply quote filters after other filters
        command = command.videoFilters([...filters, ...quoteFilters].join(","));
      }
    }

    command
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("FFmpeg command:", commandLine);
      })
      .on("progress", (progress) => {
        if (progress.percent && onProgress) {
          onProgress(progress.percent);
        }
      })
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
}


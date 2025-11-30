import type { BreathingRoomConfig } from "@/app/types";
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

export interface TimelineFrame {
  time: number;
  scale: number;
  brightness: number;
  warmth: number;
}

/**
 * Generate animation timeline for breathing room
 */
export function generateTimeline(config: BreathingRoomConfig): TimelineFrame[] {
  const totalDuration = config.durationHours * 3600; // Convert hours to seconds
  const fps = config.resolution === "4k" ? 30 : 30;
  const totalFrames = Math.floor(totalDuration * fps);
  const frames: TimelineFrame[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    
    // Calculate breathing cycle
    const cycleProgress = (time % config.breathDuration) / config.breathDuration;
    const breathingPhase = Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;
    
    // Calculate scale (1.0 to 1.0 + intensity)
    const scale = 1.0 + breathingPhase * config.breathIntensity;
    
    // Calculate brightness pulse
    const brightness = 1.0 + Math.sin(cycleProgress * Math.PI * 2) * config.brightnessPulse * 0.1;
    
    // Warmth shift
    const warmth = config.lightWarmthShift;

    frames.push({
      time,
      scale,
      brightness,
      warmth,
    });
  }

  return frames;
}

/**
 * Prepare FFmpeg filter complex for breathing animation
 */
export function prepareFFmpegFilters(
  config: BreathingRoomConfig,
  roomImagePath: string,
  outputPath: string
): string {
  const totalDuration = config.durationHours * 3600;
  const fps = 30;
  
  // Build scale filter expression for breathing
  const scaleExpr = `scale=iw*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration})):ih*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration}))`;
  
  // Build brightness filter expression
  const brightnessExpr = `1+${config.brightnessPulse * 0.1}*sin(2*PI*t/${config.breathDuration})`;
  
  // Build color temperature filter
  const warmth = config.lightWarmthShift;
  const coolness = 1 - warmth;
  const colorBalance = `colorbalance=rs=${warmth * 0.2}:gs=${(warmth - coolness) * 0.1}:bs=${-coolness * 0.2}`;

  // Resolution settings
  const resolution = config.resolution === "4k" ? "3840:2160" : "1920:1080";

  // FFmpeg filter complex
  const filterComplex = [
    `[0:v]loop=loop=-1:size=1:start=0,scale=${resolution}[scaled]`,
    `[scaled]scale=iw*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration})):ih*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration})),crop=${resolution}[breathing]`,
    `[breathing]eq=brightness=${brightnessExpr}:contrast=1.0[lit]`,
    `[lit]${colorBalance}[final]`,
  ].join(";");

  return filterComplex;
}

/**
 * Render breathing room video using FFmpeg
 */
export async function renderBreathingRoom(
  config: BreathingRoomConfig,
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

    // Build filter complex string
    const scaleExpr = `scale=iw*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration})):ih*(1+${config.breathIntensity}*sin(2*PI*t/${config.breathDuration}))`;
    const cropExpr = `crop=${width}:${height}:(iw-ow)/2:(ih-oh)/2`;
    const brightnessExpr = `eq=brightness=1+${config.brightnessPulse * 0.1}*sin(2*PI*t/${config.breathDuration}):contrast=1.0`;
    
    const warmth = config.lightWarmthShift;
    const coolness = 1 - warmth;
    const colorBalanceExpr = `colorbalance=rs=${warmth * 0.2}:gs=${(warmth - coolness) * 0.1}:bs=${-coolness * 0.2}`;

    // Combine all filters into a single chain
    const videoFilter = `scale=${width}:${height},${scaleExpr},${cropExpr},${brightnessExpr},${colorBalanceExpr}`;

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


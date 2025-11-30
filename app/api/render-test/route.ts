import { NextRequest, NextResponse } from "next/server";
import { renderBreathingRoom } from "@/templates/breathing-room";
import { renderDarkAcademiaRoom } from "@/templates/dark-academia-room";
import type { BreathingRoomConfig, DarkAcademiaConfig } from "@/app/types";
import path from "path";
import fs from "fs/promises";
import { writeFile, unlink } from "fs/promises";

export const maxDuration = 60; // 1 minute max for test renders

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const configJson = formData.get("config") as string;
    const templateType = formData.get("template") as string || "breathing-room";
    const audioFile = formData.get("audio") as File | null;

    if (!configJson) {
      return NextResponse.json({ error: "Missing config" }, { status: 400 });
    }

    // Parse config based on template type
    let config: BreathingRoomConfig | DarkAcademiaConfig;
    if (templateType === "dark-academia-room") {
      config = JSON.parse(configJson) as DarkAcademiaConfig;
    } else {
      config = JSON.parse(configJson) as BreathingRoomConfig;
    }
    
    // Override duration to 10 seconds for test
    const testConfig = {
      ...config,
      durationHours: 10 / 3600, // 10 seconds
    };

    // Create temp directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), "tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    // Handle room image path
    const roomImagePath = path.join(process.cwd(), "public", testConfig.roomImage);
    
    // Check if room image exists
    try {
      await fs.access(roomImagePath);
    } catch {
      console.warn(`Room image not found: ${roomImagePath}`);
    }

    // Handle audio
    let audioPath: string | null = null;
    if (audioFile) {
      const audioBuffer = await audioFile.arrayBuffer();
      audioPath = path.join(tmpDir, `audio-test-${Date.now()}.${audioFile.name.split('.').pop()}`);
      await writeFile(audioPath, Buffer.from(audioBuffer));
    } else {
      // Use built-in audio track
      const audioDir = templateType === "dark-academia-room" 
        ? path.join(process.cwd(), "audio", "dark-academia")
        : path.join(process.cwd(), "audio");
      
      const builtInAudioPath = path.join(audioDir, `${testConfig.audioTrack}.mp3`);
      try {
        await fs.access(builtInAudioPath);
        audioPath = builtInAudioPath;
      } catch {
        const fallbackPath = path.join(process.cwd(), "audio", `${testConfig.audioTrack}.mp3`);
        try {
          await fs.access(fallbackPath);
          audioPath = fallbackPath;
        } catch {
          console.warn(`Built-in audio not found: ${builtInAudioPath}`);
        }
      }
    }

    // Generate output path
    const outputFilename = `test-${templateType}-${Date.now()}.mp4`;
    const outputPath = path.join(tmpDir, outputFilename);

    // Render video based on template type
    if (templateType === "dark-academia-room") {
      await renderDarkAcademiaRoom(
        testConfig as DarkAcademiaConfig,
        roomImagePath,
        audioPath,
        outputPath,
        (progress) => {
          console.log(`Test render progress: ${progress}%`);
        }
      );
    } else {
      await renderBreathingRoom(
        testConfig as BreathingRoomConfig,
        roomImagePath,
        audioPath,
        outputPath,
        (progress) => {
          console.log(`Test render progress: ${progress}%`);
        }
      );
    }

    // Read the output file
    const videoBuffer = await fs.readFile(outputPath);

    // Clean up temp files
    try {
      await unlink(outputPath);
      if (audioPath && audioFile) {
        await unlink(audioPath);
      }
    } catch (err) {
      console.warn("Failed to clean up temp files:", err);
    }

    // Return video file
    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
      },
    });
  } catch (error) {
    console.error("Test render error:", error);
    return NextResponse.json(
      { error: "Test render failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


// ------------------------------------------------------------
// Space Elevator Motion Engine (LTX → Runware Fallback)
// ------------------------------------------------------------

import { falClient } from "@/lib/fal";
import { runware } from "@/lib/runware";

interface SpaceElevatorOptions {
  imageUrl: string;
  intensity: number;
  durationSeconds: number;
}

// ------------------------------------------------------------
// Environment Validation
// ------------------------------------------------------------
function validateEnv() {
  const hasLTX = !!process.env.FAL_MODEL_LTX;
  const hasRunware = !!process.env.RUNWARE_MODEL_MOTION;

  if (!hasLTX && !hasRunware) {
    throw new Error(
      "No motion models configured. Set FAL_MODEL_LTX or RUNWARE_MODEL_MOTION."
    );
  }
}

// ------------------------------------------------------------
// LTX Motion (Primary Engine)
// ------------------------------------------------------------
async function tryLTXMotion(
  imageUrl: string,
  intensity: number,
  durationSeconds: number
): Promise<string> {
  if (!process.env.FAL_MODEL_LTX) {
    throw new Error("LTX model unavailable. Skipping to Runware fallback.");
  }

  console.log("🎥 [SpaceElevator] Attempting LTX cinematic motion...");

  try {
    const videoResult = await falClient.subscribe(
      process.env.FAL_MODEL_LTX!,
      {
        url: imageUrl,
        prompt: "slow upward elevator ride through space, cinematic",
        fps: 30,
        motion: intensity,
        duration: durationSeconds,
      }
    );

    if (!videoResult?.video?.url) {
      throw new Error("LTX response missing video URL.");
    }

    console.log("🎞️ [SpaceElevator] LTX motion successful.");
    return videoResult.video.url;
  } catch (err) {
    console.error("❌ [SpaceElevator] LTX motion failed:", err);
    throw err;
  }
}

// ------------------------------------------------------------
// Runware Motion (Fallback Engine)
// ------------------------------------------------------------
async function useRunwareMotion(
  imageUrl: string,
  intensity: number,
  durationSeconds: number
): Promise<string> {
  if (!process.env.RUNWARE_MODEL_MOTION) {
    throw new Error("Runware motion model missing from env.");
  }

  console.log("🛟 [SpaceElevator] Falling back to Runware motion...");

  const motion = await runware.motion.generate({
    model: process.env.RUNWARE_MODEL_MOTION!,
    image_url: imageUrl,
    motion: "vertical-up",
    strength: intensity,
    fps: 30,
    duration: durationSeconds,
  });

  if (!motion?.video_url) {
    throw new Error("Runware motion response missing video_url.");
  }

  console.log("🎞️ [SpaceElevator] Runware fallback succeeded.");
  return motion.video_url;
}

// ------------------------------------------------------------
// Main Export — always returns a video URL
// ------------------------------------------------------------
export async function generateSpaceElevatorVideo(options: SpaceElevatorOptions) {
  const { imageUrl, intensity, durationSeconds } = options;

  validateEnv();

  console.log("🚀 [SpaceElevator] Starting motion pipeline...");

  // Try LTX first
  try {
    return await tryLTXMotion(imageUrl, intensity, durationSeconds);
  } catch (_) {
    console.log("⚠️ [SpaceElevator] Switching to fallback...");
  }

  // Fallback: Runware
  return await useRunwareMotion(imageUrl, intensity, durationSeconds);
}



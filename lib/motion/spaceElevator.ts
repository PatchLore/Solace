import { falClient } from "@/lib/fal";
import { runware } from "@/lib/runware";

export async function generateSpaceElevatorVideo(
  imageUrl: string,
  intensity: number,
  durationSeconds: number,
  forceRunware: boolean = false
): Promise<string> {

  // ---- Validate environment ----
  const hasLtx = !!process.env.FAL_MODEL_LTX;
  const RUNWARE_MOTION_MODEL = process.env.RUNWARE_MODEL_MOTION;
  const hasRunwareMotion = !!RUNWARE_MOTION_MODEL;

  if (!hasLtx && !hasRunwareMotion) {
    throw new Error("No motion model available (LTX or Runware).");
  }

  // ---- Determine provider based on duration ----
  let provider: "ltx" | "runware" = "ltx";
  
  if (durationSeconds >= 10) {
    if (!RUNWARE_MOTION_MODEL) {
      console.warn("⚠️ Runware motion model missing — falling back to LTX motion.");
      provider = "ltx";
    } else {
      provider = "runware";
    }
  } else {
    provider = "ltx"; // 5s fast preview uses LTX
  }

  console.log("Selected provider:", provider, "for duration:", durationSeconds);

  // ---- Force Runware if explicitly requested (and available) ----
  if (forceRunware && hasRunwareMotion) {
    provider = "runware";
  }

  // ---- Use Runware if selected ----
  if (provider === "runware" && hasRunwareMotion) {
    console.log("🎥 Using Runware motion (forced for duration >= 10s)...");

    const motion = await runware.motion.generate({
      model: RUNWARE_MOTION_MODEL!,
      image_url: imageUrl,
      motion: "vertical-up",
      strength: intensity,
      fps: 30,
      duration: durationSeconds
    });

    if (!motion?.video_url) {
      throw new Error("Runware motion failed: no video_url returned.");
    }

    return motion.video_url;
  }

  // ---- Try LTX first (for durations < 10 seconds) ----
  if (hasLtx) {
    try {
      console.log("🎥 Using LTX motion...");

      const response = await falClient.subscribe(
        process.env.FAL_MODEL_LTX!,
        {
          input_image: imageUrl,          // CORRECT PARAM
          motion_strength: intensity,     // CORRECT PARAM
          duration: durationSeconds,      // CORRECT PARAM
          fps: 30                         // CORRECT PARAM
        } as any
      ) as any;

      // LTX returns { video_url: string }
      if (response?.video_url) {
        return response.video_url;
      }

      console.warn("⚠️ LTX returned no video_url, falling back...");
    } catch (err) {
      console.warn("❌ LTX motion failed, falling back to Runware:", err);
    }
  }

  // ---- Runware fallback ----
  if (hasRunwareMotion) {
    console.log("🎥 Using Runware motion fallback...");

    const motion = await runware.motion.generate({
      model: process.env.RUNWARE_MODEL_MOTION!,
      image_url: imageUrl,
      motion: "vertical-up",
      strength: intensity,
      fps: 30,
      duration: durationSeconds
    });

    if (!motion?.video_url) {
      throw new Error("Runware motion failed: no video_url returned.");
    }

    return motion.video_url;
  }

  throw new Error("No motion route available.");
}

import { falClient } from "@/lib/fal";
import { runware } from "@/lib/runware";

export async function generateSpaceElevatorVideo(
  imageUrl: string,
  intensity: number,
  durationSeconds: number
): Promise<string> {

  // ---- Validate environment ----
  const hasLtx = !!process.env.FAL_MODEL_LTX;
  const hasRunwareMotion = !!process.env.RUNWARE_MODEL_MOTION;

  if (!hasLtx && !hasRunwareMotion) {
    throw new Error("No motion model available (LTX or Runware).");
  }

  // ---- Try LTX first ----
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

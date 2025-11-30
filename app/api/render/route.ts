import { NextResponse } from "next/server";
import { generateBackgroundImage } from "@/lib/generation/background";
import { generateSpaceElevatorVideo } from "@/lib/motion/spaceElevator";

// ------------------------------------------------------------
// SUPPORTED TEMPLATES
// ------------------------------------------------------------
const VALID_TEMPLATES = ["space-elevator"];

// ------------------------------------------------------------
// MAIN RENDER ENDPOINT
// ------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      template,
      prompt,
      elevatorImage,
      intensity = 0.4,
      duration = 5,
      durationSeconds,
      testMode = false,
    } = body;

    console.log("🎨 [Render] Incoming request:", body);

    // ------------------------------------------------------------
    // VALIDATE TEMPLATE
    // ------------------------------------------------------------
    if (!template || !VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { ok: false, error: "Invalid or missing template." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // SPACE ELEVATOR TEMPLATE
    // ------------------------------------------------------------
    if (template === "space-elevator") {
      if (!elevatorImage) {
        return NextResponse.json(
          { ok: false, error: "Missing elevatorImage." },
          { status: 400 }
        );
      }

      // Validate durationSeconds (required for space-elevator)
      if (!durationSeconds && !testMode) {
        return NextResponse.json(
          { ok: false, error: "durationSeconds missing" },
          { status: 400 }
        );
      }

      console.log("🚀 [SpaceElevator] Starting render…");
      console.log("Space Elevator testMode:", testMode);
      
      // Apply duration overrides (loop mode) - only 5s/10s/20s allowed
      const finalDurationSeconds = testMode ? 10 : Number(durationSeconds);
      const motionIntensity = testMode ? 0.4 : Number(intensity);
      
      // Validate duration is one of the allowed values
      if (!testMode && ![5, 10, 20].includes(finalDurationSeconds)) {
        return NextResponse.json(
          { ok: false, error: "durationSeconds must be 5, 10, or 20" },
          { status: 400 }
        );
      }
      
      console.log("Duration (seconds):", finalDurationSeconds);
      console.log("Motion intensity:", motionIntensity);

      // Build full image URL (public path → absolute URL)
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3003";

      const imageUrl = elevatorImage.startsWith("http")
        ? elevatorImage
        : `${baseUrl}${elevatorImage}`;

      // Generate motion video with LTX → Runware fallback
      // Force Runware if duration >= 10 seconds
      const useRunware = finalDurationSeconds >= 10;
      console.log("Selected provider:", useRunware ? "runware" : "ltx", "for duration:", finalDurationSeconds);
      
      const videoUrl = await generateSpaceElevatorVideo(
        imageUrl,
        motionIntensity,
        finalDurationSeconds,
        useRunware
      );

      console.log("🎉 [SpaceElevator] Render complete:", videoUrl);

      return NextResponse.json({ ok: true, videoUrl });
    }

    // ------------------------------------------------------------
    // UNKNOWN TEMPLATE (should never happen)
    // ------------------------------------------------------------
    return NextResponse.json(
      { ok: false, error: "Unexpected template handler error." },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("❌ [Render] Fatal error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error occurred.",
      },
      { status: 500 }
    );
  }
}

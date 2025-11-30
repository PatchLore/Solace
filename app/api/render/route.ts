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

      console.log("🚀 [SpaceElevator] Starting render…");

      // Build full image URL (public path → absolute URL)
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3003";

      const imageUrl = elevatorImage.startsWith("http")
        ? elevatorImage
        : `${baseUrl}${elevatorImage}`;

      // Generate motion video with LTX → Runware fallback
      const videoUrl = await generateSpaceElevatorVideo({
        imageUrl,
        intensity: Number(intensity),
        durationSeconds: Number(duration),
      });

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

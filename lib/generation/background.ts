import { runware } from "@/lib/runware";

export interface BackgroundImageOptions {
  prompt: string;
  width?: number;
  height?: number;
}

function validateEnv() {
  if (!process.env.RUNWARE_MODEL_FLUX) {
    throw new Error(
      "RUNWARE_MODEL_FLUX is missing. Add it to your .env (e.g., runware:111@1)."
    );
  }
}

export async function generateBackgroundImage(
  options: BackgroundImageOptions
): Promise<string> {
  validateEnv();

  const { prompt, width = 1920, height = 1080 } = options;

  console.log("🖼️ [Background] Generating image with Runware FLUX…");

  try {
    const response = await runware.image.generate({
      model: process.env.RUNWARE_MODEL_FLUX!,
      prompt,
      resolution: `${width}x${height}`,
    });

    const imageUrl = response?.image_url;

    if (!imageUrl) {
      throw new Error("Runware image generation returned no image_url.");
    }

    console.log("✅ [Background] Image generated successfully:", imageUrl);
    return imageUrl;
  } catch (err) {
    console.error("❌ [Background] Runware FLUX generation failed:", err);
    throw new Error("Background generation failed.");
  }
}


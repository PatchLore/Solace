// Shader renderer using canvas for frame generation
import { createCanvas, loadImage } from "canvas";
import fs from "fs/promises";
import path from "path";

type ShaderMode = "none" | "breathing1" | "breathing2" | "breathing3" | "breathing4" | "warp" | "zenglow";

interface ShaderRenderParams {
  shaderMode: ShaderMode;
  imagePath: string;
  outputDir: string;
  width: number;
  height: number;
  fps: number;
  duration: number; // in seconds
  strength?: number;
  exposure?: number;
  oscillation?: number;
  lightPulse?: number;
}

export async function renderShaderFrames(params: ShaderRenderParams): Promise<string[]> {
  const {
    shaderMode,
    imagePath,
    outputDir,
    width,
    height,
    fps,
    duration,
    strength = 0.023,
    exposure = 1.02,
    oscillation = 1.0 / 6,
    lightPulse = 0.045,
  } = params;

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Load source image
  const sourceImage = await loadImage(imagePath);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const totalFrames = Math.ceil(duration * fps);
  const frameFiles: string[] = [];

  console.log(`[Shader Render] Generating ${totalFrames} frames at ${fps} fps...`);

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    const frameNumber = frame + 1;
    const framePath = path.join(outputDir, `frame_${String(frameNumber).padStart(4, "0")}.png`);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply shader effect based on mode
    switch (shaderMode) {
      case "none":
        // Static image
        ctx.drawImage(sourceImage, 0, 0, width, height);
        break;

      case "breathing1":
      case "breathing2":
      case "breathing3":
      case "breathing4": {
        // Breathing effect
        const breathing = Math.sin(time * oscillation) * strength;
        const scale = 1 + breathing;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(sourceImage, 0, 0, width, height);

        // Apply brightness pulse for v2+
        if (shaderMode === "breathing2" || shaderMode === "breathing3" || shaderMode === "breathing4") {
          const pulse = Math.sin(time * oscillation * (shaderMode === "breathing4" ? lightPulse : 2.0)) * 0.1 + 1.0;
          const brightness = exposure * pulse;
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = `rgba(${brightness * 255}, ${brightness * 255}, ${brightness * 255}, ${1 - 1 / brightness})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Additional brightness boost for v3
        if (shaderMode === "breathing3") {
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();
        break;
      }

      case "warp": {
        // Wave distortion effect
        ctx.save();
        const wave = Math.sin((height / 10) + time * 2) * 2;
        ctx.translate(wave, 0);
        ctx.drawImage(sourceImage, 0, 0, width, height);
        ctx.restore();
        break;
      }

      case "zenglow": {
        // Breathing with glow
        const breathing = Math.sin(time * oscillation) * strength * 0.5;
        const scale = 1 + breathing;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(sourceImage, 0, 0, width, height);

        // Add glow effect (radial gradient)
        const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.15)");
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Brightness boost
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }
    }

    // Save frame
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(framePath, buffer);
    frameFiles.push(framePath);

    if ((frame + 1) % 30 === 0) {
      console.log(`[Shader Render] Generated ${frame + 1}/${totalFrames} frames...`);
    }
  }

  console.log(`[Shader Render] All ${totalFrames} frames generated`);
  return frameFiles;
}


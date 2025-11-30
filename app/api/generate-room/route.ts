import { NextRequest, NextResponse } from "next/server";
import type { GenerateRoomRequest, RoomTemplate } from "@/app/types";
import fs from "fs/promises";
import path from "path";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

// Fallback: Load .env.local if Next.js didn't load it automatically
if (!process.env.RUNWARE_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const envLines = envContent.split("\n");
    for (const line of envLines) {
      const [key, ...valueParts] = line.split("=");
      if (key?.trim() === "RUNWARE_API_KEY") {
        process.env.RUNWARE_API_KEY = valueParts.join("=").trim();
        console.log("✅ Loaded RUNWARE_API_KEY from .env.local fallback");
        break;
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not load .env.local fallback:", error);
  }
}

const RUNWARE_API_URL = "https://api.runware.ai/v1/inference";

/**
 * Sanitize filename for safe saving
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Load default template file
 */
async function loadDefaultTemplate(style: string): Promise<RoomTemplate | null> {
  try {
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "rooms",
      "default",
      `${style}.json`
    );
    const content = await fs.readFile(templatePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load default template for style ${style}:`, error);
    return null;
  }
}

/**
 * Save custom room template
 */
async function saveCustomTemplate(
  name: string,
  prompt: string,
  negativePrompt: string | undefined,
  imageUrl: string,
  model: "flux" | "seedream" | "seedream4"
): Promise<string> {
  const sanitizedName = sanitizeFilename(name);
  const template: RoomTemplate = {
    name,
    prompt,
    negativePrompt,
    style: "custom",
    createdAt: new Date().toISOString(),
    imageUrl,
    model,
  };

  const customDir = path.join(process.cwd(), "templates", "rooms", "custom");
  await fs.mkdir(customDir, { recursive: true });

  const templatePath = path.join(customDir, `${sanitizedName}.json`);
  await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

  return sanitizedName;
}

/**
 * Generate AI image using Runware (Flux Schnell or Seedream XL2)
 */
async function generateWithRunware(
  prompt: string,
  negativePrompt: string | undefined,
  model: "flux" | "seedream" | "seedream4"
): Promise<Buffer> {
  const apiKey = process.env.RUNWARE_API_KEY;
  console.log("RUNWARE KEY CHECK:", process.env.RUNWARE_API_KEY);

  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY environment variable is not set");
  }

  // Safeguard: Ensure negativePrompt is never empty
  // Runware requires a valid string or it should be omitted
  // Set to "none" if empty or only whitespace
  if (!negativePrompt || negativePrompt.trim().length < 2) {
    console.log("[Runware] negativePrompt was empty/whitespace, setting to 'none'");
    negativePrompt = "none";
  }

  // Model mapping to Runware model IDs
  const modelMap: Record<string, string> = {
    flux: "runware:101@1",                      // Flux Schnell
    flux2: "runware:102@1",                     // (optional) Flux 2 Dev if you add it later
    seedream: "cagliostrolab/seedream2-xl",    // Old Seedream XL
    seedream4: "bytedance:5@0"                 // NEW Seedream 4 (ByteDance)
  };

  // Resolve model with safe fallback
  const resolvedModel = modelMap[model] || modelMap["flux"];

  // CORRECT payload structure + parameter names
  // v1/inference endpoint uses Authorization header, NOT apiKey in payload
  // v1/inference requires taskType and taskUUID parameters
  // Base payload structure
  const payload: any = {
    taskType: "imageInference", // Required for v1/inference endpoint
    taskUUID: randomUUID(), // Required unique identifier for the task
    model: resolvedModel, // Use resolved model from map
    positivePrompt: prompt, // Runware API field name
    // Runware requires multiples of 64, max 2048
    width: 2048,
    height: 1152,
  };

  // Set steps and guidance based on model
  if (model === "flux") {
    payload.steps = 28;
    payload.guidance = 5;
    payload.negativePrompt = negativePrompt; // Already validated above
  } else {
    payload.guidance = 7;
    // Seedream 4 does NOT support steps or negativePrompt
    if (resolvedModel !== "bytedance:5@0") {
      payload.steps = 30;
      payload.negativePrompt = negativePrompt; // Already validated above
    }
  }

  // Debug: Log headers before fetch
  // v1/inference endpoint requires Authorization header with Bearer prefix
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // v1/inference requires Bearer token format
    "Authorization": `Bearer ${apiKey}`,
  };
  console.log("RUNWARE API HEADERS:", JSON.stringify(headers, null, 2));
  console.log("RUNWARE API KEY VALUE:", apiKey ? `${apiKey.substring(0, 10)}...` : "NULL");
  console.log("RUNWARE API URL:", RUNWARE_API_URL);
  console.log("RUNWARE PAYLOAD:", JSON.stringify([payload], null, 2));

  // MUST BE ARRAY for Runware API
  // Note: apiKey is NOT in payload - only in Authorization header
  const response = await fetch(RUNWARE_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify([payload]),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Runware API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // NEW Runware 2025 response formats
  let imageURL: string | null = null;

  // Format: data[0].imageURL
  if (data?.data && Array.isArray(data.data) && data.data[0]?.imageURL) {
    imageURL = data.data[0].imageURL;
  }

  // If still missing, throw
  if (!imageURL) {
    console.error("[Runware] Unexpected response:", data);
    throw new Error(
      "Runware API returned no image. Check console for full response."
    );
  }

  // Fetch image from imageURL
  const imageResponse = await fetch(imageURL);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch generated image from URL: ${imageURL}`);
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * API Route Handler
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRoomRequest = await request.json();

    // Validate
    if (body.style === "custom" && (!body.customPrompt || !body.customPrompt.trim())) {
      return NextResponse.json(
        { error: "Custom prompt is required when style = 'custom'" },
        { status: 400 }
      );
    }

    // Determine active prompt & model
    let prompt: string;
    let negativePrompt: string | undefined;
    let model: "flux" | "seedream" | "seedream4" = body.model || "flux";

    if (body.style === "custom") {
      prompt = body.customPrompt!;
      negativePrompt = body.customNegativePrompt;
    } else {
      const template = await loadDefaultTemplate(body.style);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found for style: ${body.style}` },
          { status: 404 }
        );
      }
      prompt = template.prompt;
      negativePrompt = template.negativePrompt;
      if (template.model) model = template.model;
    }

    // Generate image with Runware
    const imageBuffer = await generateWithRunware(prompt, negativePrompt, model);

    // Save generated image
    const generatedDir = path.join(process.cwd(), "public", "generated", "rooms");
    await fs.mkdir(generatedDir, { recursive: true });

    const filename = `generated-room-${Date.now()}.png`;
    const imagePath = path.join(generatedDir, filename);

    await fs.writeFile(imagePath, imageBuffer);

    const imageUrl = `/generated/rooms/${filename}`;

    // Save template if needed
    let templateSaved = false;
    let templateName: string | null = null;

    if (body.saveAsTemplate && body.style === "custom" && body.customName) {
      templateName = await saveCustomTemplate(
        body.customName,
        prompt,
        negativePrompt,
        imageUrl,
        model
      );
      templateSaved = true;
    }

    return NextResponse.json({
      url: imageUrl,
      templateSaved,
      templateName,
    });
  } catch (error) {
    console.error("Generate room error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate room",
        runware: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      elevatorImage,
      backgroundImage,
      duration = 10,
      speed = 0.5,
      direction = "up",
    } = body;

    if (!elevatorImage || !backgroundImage) {
      return NextResponse.json(
        { error: "Missing elevatorImage or backgroundImage" },
        { status: 400 }
      );
    }

    const kiveApiKey = process.env.KIVE_API_KEY;
    if (!kiveApiKey) {
      return NextResponse.json(
        { error: "KIVE_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Step 1: Request background motion video from Kive Motion API
    console.log("[Elevator Render] Step 1: Generating background motion video...");
    const kiveResponse = await fetch("https://api.kive.ai/motion/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kiveApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_image: backgroundImage,
        motion: {
          type: "pan",
          direction: direction,
          speed: speed,
          smoothness: 0.9,
        },
        duration: duration,
        resolution: "1920x1080",
      }),
    });

    if (!kiveResponse.ok) {
      const err = await kiveResponse.text();
      console.error("[Elevator Render] Kive API Error:", err);
      return NextResponse.json(
        { error: `Kive API Error: ${err}` },
        { status: 500 }
      );
    }

    const kiveData = await kiveResponse.json();
    const backgroundVideoUrl = kiveData.output_url || kiveData.video_url;

    if (!backgroundVideoUrl) {
      return NextResponse.json(
        { error: "Kive API did not return video URL" },
        { status: 500 }
      );
    }

    console.log("[Elevator Render] Step 2: Background video URL:", backgroundVideoUrl);

    // Step 2: Compose background video with elevator PNG using FFmpeg WASM
    console.log("[Elevator Render] Step 2: Composing elevator overlay...");

    // Import FFmpeg WASM dynamically
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    // Load FFmpeg
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    // Download background video
    const backgroundVideoResponse = await fetch(backgroundVideoUrl);
    const backgroundVideoBlob = await backgroundVideoResponse.blob();
    const backgroundVideoArrayBuffer = await backgroundVideoBlob.arrayBuffer();

    // Download elevator image
    let elevatorImageBlob: Blob;
    if (elevatorImage.startsWith("data:")) {
      // Base64 image
      const base64Data = elevatorImage.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      elevatorImageBlob = new Blob([bytes], { type: "image/png" });
    } else {
      // URL image
      const elevatorResponse = await fetch(elevatorImage);
      elevatorImageBlob = await elevatorResponse.blob();
    }
    const elevatorImageArrayBuffer = await elevatorImageBlob.arrayBuffer();

    // Write files to FFmpeg virtual filesystem
    await ffmpeg.writeFile("background.mp4", new Uint8Array(backgroundVideoArrayBuffer));
    await ffmpeg.writeFile("elevator.png", new Uint8Array(elevatorImageArrayBuffer));

    // Run FFmpeg overlay command
    await ffmpeg.exec([
      "-i",
      "background.mp4",
      "-i",
      "elevator.png",
      "-filter_complex",
      "overlay=0:0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "output.mp4",
    ]);

    // Read output file
    const outputData = await ffmpeg.readFile("output.mp4");

    // Cleanup
    await ffmpeg.deleteFile("background.mp4");
    await ffmpeg.deleteFile("elevator.png");
    await ffmpeg.deleteFile("output.mp4");

    // Convert to base64 for response
    const outputBlob = new Blob([outputData], { type: "video/mp4" });
    const outputArrayBuffer = await outputBlob.arrayBuffer();
    const outputBase64 = Buffer.from(outputArrayBuffer).toString("base64");

    console.log("[Elevator Render] Step 3: Composition complete");

    return NextResponse.json({
      success: true,
      videoBase64: outputBase64,
      mimeType: "video/mp4",
    });
  } catch (e: any) {
    console.error("[Elevator Render] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


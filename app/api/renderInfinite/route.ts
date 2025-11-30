import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, duration = 10, speed = 0.8 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const kiveApiKey = process.env.KIVE_API_KEY;
    if (!kiveApiKey) {
      return NextResponse.json({ error: "KIVE_API_KEY not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.kive.ai/motion/infinite", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${kiveApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: imageBase64,
        mode: "infinite_zoom",
        duration,
        speed,
        resolution: "1920x1080"
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Kive API Error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ videoUrl: data.output_url });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


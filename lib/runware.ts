// lib/runware.ts
// Runware API client using fetch (no npm package dependency)

import { randomUUID } from "crypto";

if (!process.env.RUNWARE_API_KEY) {
  throw new Error("Missing RUNWARE_API_KEY in environment variables.");
}

const RUNWARE_API_URL = "https://api.runware.ai/v1/inference";

// Runware client interface matching the npm package API
export const runware = {
  image: {
    async generate(params: {
      model: string;
      prompt: string;
      resolution: string;
    }): Promise<{ image_url: string }> {
      const response = await fetch(RUNWARE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RUNWARE_API_KEY}`,
        },
        body: JSON.stringify([{
          taskType: "imageInference",
          taskUUID: randomUUID(),
          model: params.model,
          positivePrompt: params.prompt,
          width: parseInt(params.resolution.split("x")[0]),
          height: parseInt(params.resolution.split("x")[1]),
          guidance: 7,
          steps: 30,
        }]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Runware API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let imageURL: string | null = null;

      if (data?.data && Array.isArray(data.data) && data.data[0]?.imageURL) {
        imageURL = data.data[0].imageURL;
      }

      if (!imageURL) {
        throw new Error("Runware API returned no image URL");
      }

      return { image_url: imageURL };
    },
  },
  motion: {
    async generate(params: {
      model: string;
      image_url: string;
      motion: string;
      strength: number;
      fps: number;
      duration: number;
    }): Promise<{ video_url: string }> {
      const response = await fetch(RUNWARE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RUNWARE_API_KEY}`,
        },
        body: JSON.stringify([{
          taskType: "motionInference",
          taskUUID: randomUUID(),
          model: params.model,
          imageURL: params.image_url,
          motion: params.motion,
          strength: params.strength,
          fps: params.fps,
          duration: params.duration,
        }]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Runware motion API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let videoURL: string | null = null;

      if (data?.data && Array.isArray(data.data) && data.data[0]?.videoURL) {
        videoURL = data.data[0].videoURL;
      }

      if (!videoURL) {
        throw new Error("Runware motion API returned no video URL");
      }

      return { video_url: videoURL };
    },
  },
};


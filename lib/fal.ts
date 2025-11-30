// lib/fal.ts

import fal from "@fal-ai/serverless-client";

if (!process.env.FAL_KEY) {
  throw new Error("Missing FAL_KEY in environment variables.");
}

fal.config({
  credentials: process.env.FAL_KEY,
});

export const falClient = fal;


// lib/fal.ts

import { config, subscribe } from "@fal-ai/serverless-client";

if (!process.env.FAL_KEY) {
  throw new Error("Missing FAL_KEY in environment variables.");
}

config({
  credentials: process.env.FAL_KEY,
});

// Export a client-like object that matches the expected API
export const falClient = {
  subscribe,
};


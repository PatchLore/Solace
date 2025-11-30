// lib/fal.ts

import { client as falClient } from "@fal-ai/serverless-client";

if (!process.env.FAL_KEY) {
  throw new Error("Missing FAL_KEY in environment variables.");
}

falClient.config({
  credentials: process.env.FAL_KEY,
});

export { falClient };


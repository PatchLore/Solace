// lib/runware.ts

import Runware from "runware";

if (!process.env.RUNWARE_API_KEY) {
  throw new Error("Missing RUNWARE_API_KEY in environment variables.");
}

export const runware = new Runware({
  apiKey: process.env.RUNWARE_API_KEY,
});


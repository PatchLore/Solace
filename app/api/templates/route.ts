import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { RoomTemplate } from "@/app/types";

/**
 * Load all custom templates
 */
async function loadCustomTemplates(): Promise<RoomTemplate[]> {
  try {
    const customDir = path.join(process.cwd(), "templates", "rooms", "custom");
    await fs.mkdir(customDir, { recursive: true });

    const files = await fs.readdir(customDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const templates: RoomTemplate[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(customDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const template = JSON.parse(content) as RoomTemplate;
        templates.push(template);
      } catch (error) {
        console.error(`Failed to load template ${file}:`, error);
      }
    }

    return templates.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Failed to load custom templates:", error);
    return [];
  }
}

export async function GET() {
  try {
    const templates = await loadCustomTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}


import { readFile } from "node:fs/promises";
import type { Surface, ToolDef } from "../model.ts";

function coerce(raw: unknown): ToolDef[] {
  const arr = Array.isArray(raw) ? raw : (raw as { tools?: unknown }).tools;
  if (!Array.isArray(arr)) throw new Error("Expected a JSON array of tools or an object with a `tools` array.");
  return arr.map((t, i) => {
    if (!t || typeof t !== "object" || typeof (t as ToolDef).name !== "string") {
      throw new Error(`Tool at index ${i} is missing a string "name".`);
    }
    const tt = t as ToolDef;
    return { name: tt.name, description: tt.description, inputSchema: tt.inputSchema };
  });
}

export async function loadStaticSurface(path: string): Promise<Surface> {
  const text = await readFile(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${path} is not valid JSON.`);
  }
  const serverName = (parsed as { serverName?: string }).serverName;
  return { serverName, tools: coerce(parsed) };
}

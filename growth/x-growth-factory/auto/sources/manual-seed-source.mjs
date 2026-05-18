import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadManualSeeds({ config, rootDir }) {
  if (!config.sources.manualSeed.enabled) return [];
  const seedPath = path.resolve(rootDir, config.sources.manualSeed.path);
  const payload = JSON.parse(await readFile(seedPath, "utf8"));
  return (payload.items ?? []).map((item) => ({
    source: "manual",
    theme: String(item.theme ?? ""),
    keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
  }));
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function post({ post, config, rootDir }) {
  const exportPath = path.resolve(rootDir, config.manualExportPath);
  await mkdir(path.dirname(exportPath), { recursive: true });
  await writeFile(
    exportPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        adapter: "manual",
        post,
      },
      null,
      2
    )
  );

  return {
    status: "exported",
    postId: null,
    adapter: "manual",
    message: `Wrote manual export to ${exportPath}`,
  };
}

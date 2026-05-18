import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const autoDir = path.dirname(fileURLToPath(import.meta.url));
const factoryDir = path.resolve(autoDir, "..");
const logPath = path.join(factoryDir, "queue", "posting_log.json");
const metricsPath = path.join(autoDir, "pdca", "metrics.json");
const memoryPath = path.join(autoDir, "pdca", "pattern-memory.json");
const reportPath = path.join(autoDir, "pdca", "weekly-pdca-report.md");

const postingLog = await readQueue(logPath);
const metrics = await readQueue(metricsPath);
const memory = await readJson(memoryPath);

const threadsPosts = postingLog.items.filter((item) => item.channel === "threads");
const posted = threadsPosts.filter((item) => item.status === "posted");
const skipped = threadsPosts.filter((item) => item.status === "skipped" || item.status === "setup_required");
const failed = threadsPosts.filter((item) => item.status === "failed");
const patternCounts = countBy(posted, "pattern");
const bestPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unclear";

const nextMemory = {
  ...memory,
  winningPatterns: bestPattern === "unclear" ? memory.winningPatterns : unique([...memory.winningPatterns, bestPattern]).slice(-10),
};

await writeJson(memoryPath, nextMemory);
await writeFile(reportPath, buildReport({ posted, skipped, failed, metrics, bestPattern }));

console.log(
  JSON.stringify(
    {
      ok: true,
      posted: posted.length,
      skipped: skipped.length,
      failed: failed.length,
      bestPattern,
    },
    null,
    2
  )
);

function buildReport({ posted, skipped, failed, metrics, bestPattern }) {
  const totals = summarizeMetrics(metrics.items);
  return `# Threads Weekly PDCA Report

Week of: ${new Date().toISOString().slice(0, 10)}

Posts:
- posted: ${posted.length}
- skipped: ${skipped.length}
- failed: ${failed.length}

Metrics:
- impressions: ${totals.impressions}
- clicks: ${totals.clicks}
- free uses: ${totals.freeUses}
- quota exceeded: ${totals.quotaExceeded}
- upgrade clicks: ${totals.upgradeClicks}
- paid conversions: ${totals.paidConversions}

Pattern learning:
- best: ${bestPattern}
- weak: unclear
- next: keep deterministic templates and review manually filled metrics
`;
}

function summarizeMetrics(items) {
  return items.reduce(
    (sum, item) => ({
      impressions: sum.impressions + Number(item.impressions ?? 0),
      clicks: sum.clicks + Number(item.clicks ?? 0),
      freeUses: sum.freeUses + Number(item.freeUses ?? 0),
      quotaExceeded: sum.quotaExceeded + Number(item.quotaExceeded ?? 0),
      upgradeClicks: sum.upgradeClicks + Number(item.upgradeClicks ?? 0),
      paidConversions: sum.paidConversions + Number(item.paidConversions ?? 0),
    }),
    { impressions: 0, clicks: 0, freeUses: 0, quotaExceeded: 0, upgradeClicks: 0, paidConversions: 0 }
  );
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function unique(items) {
  return [...new Set(items)];
}

async function readQueue(filePath) {
  const value = await readJson(filePath);
  return {
    version: value.version ?? 1,
    items: Array.isArray(value.items) ? value.items : [],
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

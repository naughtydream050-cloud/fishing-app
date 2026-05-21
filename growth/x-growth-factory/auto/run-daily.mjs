import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadManualSeeds } from "./sources/manual-seed-source.mjs";
import { loadHackerNewsTopics } from "./sources/hackernews-source.mjs";
import { loadGoogleNewsRssTopics } from "./sources/google-news-rss-source.mjs";
import { loadRssTopics } from "./sources/rss-source.mjs";
import { scoreTopics } from "./generation/topic-scorer.mjs";
import { generatePost } from "./generation/template-engine.mjs";
import { checkPostSafety } from "./generation/safety-checker.mjs";
import { addIfNotDuplicate } from "./generation/dedupe.mjs";
import { postToThreads } from "./threads/post-to-threads.mjs";

const autoDir = path.dirname(fileURLToPath(import.meta.url));
const factoryDir = path.resolve(autoDir, "..");
const rootDir = path.resolve(factoryDir, "..", "..");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || process.env.THREADS_AUTO_POST_ENABLED !== "true";
const cronSecret = readArgValue("--cron-secret");

const config = await readJson(path.join(autoDir, "config.json"));
const templates = await readJson(path.join(autoDir, "generation", "templates.json"));
const patternMemoryPath = path.join(autoDir, "pdca", "pattern-memory.json");
const approvedPath = path.join(factoryDir, "queue", "approved.json");
const logPath = path.join(factoryDir, "queue", "posting_log.json");
const patternMemory = await readJson(patternMemoryPath);
const approvedQueue = await readQueue(approvedPath);
const postingLog = await readQueue(logPath);

const result = await run();
console.log(JSON.stringify(result, null, 2));

async function run() {
  const topics = [
    ...(await loadManualSeeds({ config, rootDir })),
    ...(await loadHackerNewsTopics({ config })),
    ...(await loadGoogleNewsRssTopics({ config })),
    ...(await loadRssTopics({ config })),
  ];
  const scoredTopics = scoreTopics(topics, config, patternMemory);
  const selectedTopic = scoredTopics[0] ?? { theme: "manual fallback", keywords: [] };
  const post = generatePost({ topic: selectedTopic, templates, config, postingLog });
  const safety = checkPostSafety({ post, config, approvedQueue, postingLog });

  if (!safety.ok) {
    const entry = logEntry(post, "skipped", safety.reasons.join("; "), null);
    if (!dryRun) await appendLog(entry);
    return {
      ok: false,
      mode: dryRun ? "dry-run" : "production",
      status: "skipped",
      reasons: safety.reasons,
      post: post.text,
    };
  }

  const { queue: nextApprovedQueue, added } = addIfNotDuplicate(approvedQueue, post);

  if (dryRun) {
    return {
      ok: true,
      mode: "dry-run",
      status: "ready",
      topic: selectedTopic.theme,
      score: selectedTopic.score ?? 0,
      wouldApprove: added,
      wouldPost: post.text,
      note: "No queue, log, API, AI, or SPEC AI calls were made.",
    };
  }

  await writeJson(approvedPath, nextApprovedQueue);
  const posted = await postToThreads({ post, dryRun, cronSecret });

  if (!posted.posted) {
    await appendLog(logEntry(post, "setup_required", posted.reason, null));
    return {
      ok: false,
      mode: "production",
      status: "setup_required",
      reason: posted.reason,
      approvedCount: nextApprovedQueue.items.length,
      post: post.text,
    };
  }

  await appendLog(logEntry(post, "posted", null, posted.postId));
  return {
    ok: true,
    mode: "production",
    status: "posted",
    postId: posted.postId,
    post: post.text,
  };
}

function logEntry(post, status, error, postId) {
  return {
    postedAt: new Date().toISOString(),
    channel: "threads",
    adapter: "threads_api",
    postId,
    text: post.text,
    pattern: post.pattern,
    topic: post.topic,
    linkIncluded: post.linkIncluded,
    status,
    error,
    notes: "Daily deterministic no-token Threads workflow.",
  };
}

async function appendLog(entry) {
  const latest = await readQueue(logPath);
  await writeJson(logPath, { ...latest, items: [...latest.items, entry] });
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

function readArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

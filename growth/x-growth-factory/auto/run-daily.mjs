import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPostSafety } from "./generation/safety-checker.mjs";
import { postToThreads } from "./threads/post-to-threads.mjs";

const autoDir = path.dirname(fileURLToPath(import.meta.url));
const factoryDir = path.resolve(autoDir, "..");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || process.env.THREADS_AUTO_POST_ENABLED !== "true";
const cronSecret = readArgValue("--cron-secret");

const config = await readJson(path.join(autoDir, "config.json"));
const approvedPath = path.join(factoryDir, "queue", "approved.json");
const logPath = path.join(factoryDir, "queue", "posting_log.json");
const approvedQueue = await readQueue(approvedPath);
const postingLog = await readQueue(logPath);

const result = await run();
console.log(JSON.stringify(result, null, 2));

async function run() {
  const post = selectNextApprovedPost(approvedQueue, postingLog);
  if (!post) {
    return {
      ok: false,
      mode: dryRun ? "dry-run" : "production",
      status: "skipped",
      reasons: ["no approved unposted Threads queue item"],
    };
  }

  const safety = checkPostSafety({ post, config, approvedQueue, postingLog });

  if (!safety.ok) {
    const entry = logEntry(post, "skipped", safety.reasons.join("; "), null);
    if (!dryRun) await appendLog(entry);
    return {
      ok: false,
      mode: dryRun ? "dry-run" : "production",
      status: "skipped",
      reasons: safety.reasons,
      id: post.id,
      language: post.language,
      post: post.text,
    };
  }

  if (dryRun) {
    return {
      ok: true,
      mode: "dry-run",
      status: "ready",
      id: post.id,
      language: post.language,
      platform: post.platform,
      siteId: post.siteId,
      imageRequired: post.imageRequired,
      imageLocalPath: post.imageLocalPath,
      imageUrl: post.imageUrl,
      linkIncluded: post.linkIncluded,
      score: post.score ?? 0,
      wouldPost: post.text,
      note: "No queue, log, API, AI, or SPEC AI calls were made.",
    };
  }

  const posted = await postToThreads({ post, dryRun, cronSecret });

  if (!posted.posted) {
    await appendLog(logEntry(post, "setup_required", posted.reason, null));
    return {
      ok: false,
      mode: "production",
      status: "setup_required",
      reason: posted.reason,
      id: post.id,
      post: post.text,
    };
  }

  await appendLog(logEntry(post, "posted", null, posted.postId));
  return {
    ok: true,
    mode: "production",
    status: "posted",
    postId: posted.postId,
    id: post.id,
    post: post.text,
  };
}

function selectNextApprovedPost(queue, log) {
  const postedText = new Set(
    (log.items ?? [])
      .filter((item) => ["posted", "scheduled", "exported"].includes(item.status))
      .map((item) => normalize(item.text))
  );
  const postedIds = new Set(
    (log.items ?? [])
      .filter((item) => ["posted", "scheduled", "exported"].includes(item.status))
      .map((item) => item.id)
      .filter(Boolean)
  );

  return (queue.items ?? []).find(
    (item) =>
      item.platform === "threads" &&
      item.status === "approved" &&
      item.language === "ja" &&
      !postedIds.has(item.id) &&
      !postedText.has(normalize(item.text))
  );
}

function logEntry(post, status, error, postId) {
  return {
    postedAt: new Date().toISOString(),
    channel: "threads",
    adapter: "threads_api",
    postId,
    id: post.id,
    language: post.language,
    platform: post.platform,
    siteId: post.siteId,
    imageLocalPath: post.imageLocalPath,
    imageRequired: post.imageRequired,
    imageUrl: post.imageUrl,
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
    retiredItems: Array.isArray(value.retiredItems) ? value.retiredItems : [],
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

function normalize(text) {
  return String(text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

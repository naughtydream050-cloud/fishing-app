import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const factoryDir = path.resolve(scriptDir, "..");
const rootDir = path.resolve(factoryDir, "..", "..");
const approvedPath = path.join(factoryDir, "queue", "approved.json");
const draftsPath = path.join(factoryDir, "queue", "drafts.json");
const logPath = path.join(factoryDir, "queue", "posting_log.json");
const configPath = path.join(scriptDir, "posting-config.json");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || process.env.X_AUTO_POST_ENABLED !== "true";
const requestedAdapter = process.env.X_POSTING_ADAPTER ?? "manual";

const config = await readJson(configPath);
const approvedQueue = await readQueue(approvedPath);
const draftsQueue = await readQueue(draftsPath);
const postingLog = await readQueue(logPath);

const result = await run();
console.log(JSON.stringify(result, null, 2));

async function run() {
  const next = approvedQueue.items[0];
  if (!next) {
    return {
      ok: true,
      mode: dryRun ? "dry-run" : "production",
      status: "skipped",
      reason: "approved.json is empty",
      nextPost: null,
    };
  }

  const normalized = normalizePost(next);
  const gate = runSafetyGate(normalized);
  if (!gate.ok) {
    const entry = logEntry(normalized, {
      adapter: dryRun ? "dry-run" : requestedAdapter,
      status: "rejected",
      error: gate.reasons.join("; "),
    });
    if (!dryRun) await appendLog(entry);
    return {
      ok: false,
      mode: dryRun ? "dry-run" : "production",
      status: "rejected",
      reasons: gate.reasons,
      nextPost: normalized.text,
    };
  }

  if (dryRun) {
    return {
      ok: true,
      mode: "dry-run",
      status: "ready",
      adapter: requestedAdapter,
      nextPost: normalized.text,
      linkIncluded: normalized.linkIncluded,
      note: "No files were mutated and no post was sent.",
    };
  }

  const adapter = await loadAdapter(requestedAdapter);
  try {
    const adapterResult = await adapter.post({ post: normalized, config, rootDir });
    await consumeApprovedItem(normalized.id);
    await appendLog(
      logEntry(normalized, {
        adapter: adapterResult.adapter,
        postId: adapterResult.postId,
        status: adapterResult.status,
        error: null,
      })
    );

    return {
      ok: true,
      mode: "production",
      status: adapterResult.status,
      adapter: adapterResult.adapter,
      postId: adapterResult.postId,
      nextPost: normalized.text,
      message: adapterResult.message,
    };
  } catch (error) {
    await appendLog(
      logEntry(normalized, {
        adapter: requestedAdapter,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown posting error",
      })
    );
    return {
      ok: false,
      mode: "production",
      status: "failed",
      adapter: requestedAdapter,
      nextPost: normalized.text,
      error: error instanceof Error ? error.message : "Unknown posting error",
    };
  }
}

function runSafetyGate(post) {
  const reasons = [];
  if (post.score !== config.requiredScore) reasons.push("score is not 10/10");
  if (post.rejected) reasons.push("post is marked rejected");
  if (post.copied || post.sourceTextCopied) reasons.push("post is marked copied");
  if (!post.text || post.text.length > 280) reasons.push("post text is empty or longer than 280 chars");
  if (hasDuplicateText(post.text)) reasons.push("duplicate text found in queues or posting log");
  if (hasDuplicateRecentPattern(post.pattern)) reasons.push("duplicate pattern from latest post");
  if (hasForbiddenClaim(post.text)) reasons.push("forbidden claim detected");
  if (hasSecretLikeText(post.text)) reasons.push("secret-like text detected");
  if (!hasAccurateProductFacts(post.text)) reasons.push("product facts are missing or inaccurate");
  if (hasPostedToday()) reasons.push("daily post limit already reached");
  if (post.linkIncluded && weeklyLinkCount() >= config.weeklyLinkPostLimit) {
    reasons.push("weekly link post limit reached");
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

function normalizePost(item) {
  const text = String(item.text ?? item.post ?? "").trim();
  return {
    ...item,
    id: String(item.id ?? `approved-${Date.now()}`),
    text,
    score: Number(item.score ?? item.qualityScore ?? 0),
    pattern: String(item.pattern ?? "unknown"),
    linkIncluded: Boolean(item.linkIncluded ?? item.hasLink ?? /https?:\/\//i.test(text)),
  };
}

function hasDuplicateText(text) {
  const canonical = normalizeText(text);
  const approvedDuplicates = approvedQueue.items
    .map(normalizePost)
    .filter((item) => normalizeText(item.text) === canonical);
  const draftDuplicates = draftsQueue.items
    .map((item) => normalizeText(String(item.text ?? item.post ?? "")))
    .filter((item) => item === canonical);
  const logDuplicates = postingLog.items
    .filter((item) => ["posted", "scheduled", "exported"].includes(item.status))
    .map((item) => normalizeText(String(item.text ?? "")))
    .filter((item) => item === canonical);

  return approvedDuplicates.length > 1 || draftDuplicates.length > 0 || logDuplicates.length > 0;
}

function hasDuplicateRecentPattern(pattern) {
  const latest = postingLog.items
    .filter((item) => ["posted", "exported", "scheduled"].includes(item.status))
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))[0];
  return Boolean(latest?.pattern && latest.pattern === pattern);
}

function hasForbiddenClaim(text) {
  const lower = text.toLowerCase();
  return config.forbiddenClaims.some((claim) => lower.includes(claim.toLowerCase()));
}

function hasSecretLikeText(text) {
  return /(sk-|pk_|whsec_|api[_-]?key|access[_-]?token|secret)/i.test(text);
}

function hasAccurateProductFacts(text) {
  const lower = text.toLowerCase();
  if (!lower.includes("spec ai")) return false;
  if (/(free|pro|¥|300|analysis|analyses)/i.test(text)) {
    if (/free/i.test(text) && !/1 successful analysis\/day/i.test(text)) return false;
    if (/pro/i.test(text) && !/10 successful analyses\/day/i.test(text)) return false;
    if (/[¥￥]?\s*300|300\s*yen/i.test(text)) return /¥300\/month|300 yen\/month|300 yen\/mo|¥300\/mo/i.test(text);
  }
  return /(summary|tasks|share-ready text|share text)/i.test(text);
}

function hasPostedToday() {
  const today = localDateKey(new Date());
  return postingLog.items.some(
    (item) =>
      ["posted", "scheduled", "exported"].includes(item.status) &&
      localDateKey(new Date(item.postedAt)) === today
  );
}

function weeklyLinkCount() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  return postingLog.items.filter((item) => {
    const postedAt = new Date(item.postedAt);
    return (
      ["posted", "scheduled", "exported"].includes(item.status) &&
      item.linkIncluded &&
      postedAt >= weekStart &&
      postedAt <= now
    );
  }).length;
}

async function loadAdapter(name) {
  if (name === "manual") return import("./adapters/manual-export.mjs");
  if (name === "webhook") return import("./adapters/webhook-adapter.mjs");
  if (name === "x_api") return import("./adapters/x-api-adapter.mjs");
  throw new Error(`Unsupported X_POSTING_ADAPTER: ${name}`);
}

async function consumeApprovedItem(id) {
  const nextItems = approvedQueue.items.filter((item) => normalizePost(item).id !== id);
  await writeJson(approvedPath, { ...approvedQueue, items: nextItems });
}

async function appendLog(entry) {
  await writeJson(logPath, { ...postingLog, items: [...postingLog.items, entry] });
}

function logEntry(post, fields) {
  return {
    postedAt: new Date().toISOString(),
    postId: fields.postId ?? null,
    adapter: fields.adapter,
    text: post.text,
    pattern: post.pattern,
    linkIncluded: post.linkIncluded,
    status: fields.status,
    error: fields.error ?? null,
  };
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

function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function localDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfWeek(date) {
  const local = new Date(date);
  const day = local.getDay();
  const diff = (day + 6) % 7;
  local.setDate(local.getDate() - diff);
  local.setHours(0, 0, 0, 0);
  return local;
}

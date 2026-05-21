export function checkPostSafety({ post, config, approvedQueue, postingLog }) {
  const reasons = [];

  if (!post.text || post.text.length > config.threadsSafeLength) {
    reasons.push("post is empty or too long");
  }
  if (post.score !== 10) reasons.push("score is not 10/10");
  if (hasForbiddenClaim(post.text, config)) reasons.push("forbidden claim detected");
  if (hasSecretLikeText(post.text)) reasons.push("secret-like text detected");
  if (hasFakeClaim(post.text)) reasons.push("fake or exaggerated claim detected");
  if (hasDuplicate(post.text, approvedQueue, postingLog)) reasons.push("duplicate post text");
  if (hasPostedToday(postingLog, config)) reasons.push("daily Threads post limit reached");
  if (post.linkIncluded && weeklyLinkCount(postingLog) >= config.weeklyLinkPostLimit) {
    reasons.push("weekly link post limit reached");
  }
  if (!hasSpecAiFacts(post.text)) reasons.push("SPEC AI facts missing or inaccurate");

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

function hasForbiddenClaim(text, config) {
  const lower = text.toLowerCase();
  return config.forbiddenClaims.some((claim) => lower.includes(claim.toLowerCase()));
}

function hasSecretLikeText(text) {
  return /(sk-|pk_|whsec_|api[_-]?key|access[_-]?token|secret)/i.test(text);
}

function hasFakeClaim(text) {
  return /(testimonial|customers say|revenue|mrr|arr|thousands|millions|guaranteed)/i.test(text);
}

function hasDuplicate(text, approvedQueue, postingLog) {
  const key = normalize(text);
  return [...(approvedQueue.items ?? []), ...(postingLog.items ?? [])].some(
    (item) => ["posted", "scheduled", "exported"].includes(item.status) && normalize(item.text) === key
  );
}

function hasPostedToday(postingLog, config) {
  const today = localDateKey(new Date(), config.timezone);
  return (postingLog.items ?? []).some(
    (item) =>
      item.channel === "threads" &&
      ["posted", "scheduled", "exported"].includes(item.status) &&
      localDateKey(new Date(item.postedAt), config.timezone) === today
  );
}

function weeklyLinkCount(postingLog) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  return (postingLog.items ?? []).filter((item) => {
    const postedAt = new Date(item.postedAt);
    return (
      item.channel === "threads" &&
      ["posted", "scheduled", "exported"].includes(item.status) &&
      item.linkIncluded &&
      postedAt >= weekStart
    );
  }).length;
}

function hasSpecAiFacts(text) {
  return (
    /SPEC AI/.test(text) &&
    /summary/.test(text) &&
    /tasks/.test(text) &&
    /(share-ready text|share text)/.test(text) &&
    /1 successful analysis\/day/.test(text) &&
    /10 successful analyses\/day/.test(text) &&
    /¥300\/month/.test(text)
  );
}

function normalize(text) {
  return String(text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function localDateKey(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

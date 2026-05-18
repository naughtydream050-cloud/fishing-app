export async function loadRssTopics({ config }) {
  if (!config.sources.rss.enabled) return [];
  const topics = [];

  for (const feed of config.sources.rss.feeds) {
    try {
      const response = await fetchWithTimeout(feed, 8000);
      if (!response.ok) continue;
      const xml = await response.text();
      topics.push(...extractTitles(xml, feed));
    } catch {
      continue;
    }
  }

  return topics;
}

function extractTitles(xml, source) {
  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g)]
    .map((match) => String(match[1] ?? match[2] ?? "").trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((title) => ({
      source,
      theme: title.toLowerCase().replace(/[^\w\s-]/g, "").slice(0, 120),
      keywords: title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2)
        .slice(0, 8),
    }));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
